import os
import time
import datetime
import requests
import numpy as np
import pandas as pd
import yfinance as yf
import warnings

# --- PYTORCH IMPORTS (Replaces TensorFlow) ---
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import MinMaxScaler

# NLP
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

warnings.filterwarnings("ignore")

# Initialize NLTK
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

sia = SentimentIntensityAnalyzer()

# --- 1. PyTorch LSTM Model Class ---
class StockLSTM(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers, output_dim):
        super(StockLSTM, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.dropout = nn.Dropout(0.2)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        # Initialize hidden state with zeros
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.dropout(out[:, -1, :])
        out = self.fc(out)
        return out

# --- Helper Functions ---
def flatten_columns(df):
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ['_'.join([str(i) for i in col if i]) for col in df.columns]
    df.columns = df.columns.str.strip()
    return df

def canonicalize_ohlcv_names(df):
    rename_map = {}
    for col in df.columns:
        c = str(col).strip().lower()
        if 'open' in c: rename_map[col] = 'Open'
        if 'high' in c: rename_map[col] = 'High'
        if 'low' in c: rename_map[col] = 'Low'
        if 'close' in c: rename_map[col] = 'Close'
        if 'volume' in c: rename_map[col] = 'Volume'
    if rename_map:
        df = df.rename(columns=rename_map)
    return df

def fetch_live_news_sentiment(query, head_limit=50):
    from bs4 import BeautifulSoup # Import here to save memory if not used
    try:
        url = f"https://news.google.com/search?q={requests.utils.requote_uri(query)}&hl=en-US&gl=US&ceid=US:en"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
        r = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(r.text, "html.parser")
        
        headlines = []
        selectors = ["article h3", "h3 a", "div[role='heading']"]
        for selector in selectors:
            found = soup.select(selector)
            if found:
                for h in found[:head_limit]:
                    txt = h.get_text(strip=True)
                    if txt and len(txt) > 10:
                        headlines.append(txt)
                break
            
        today = datetime.date.today()
        rows = []
        for t in headlines:
            score = sia.polarity_scores(t)['compound']
            rows.append([today, t, score])
            
        return pd.DataFrame(rows, columns=["date","headline","Sentiment"])
    except Exception as e:
        print(f"Scraper Error: {e}")
        return pd.DataFrame(columns=["date","headline","Sentiment"])

# --- DASHBOARD DATA AGGREGATOR ---
def get_dashboard_data():
    # 1. Market Overview
    indices = { 'S&P 500': '^GSPC', 'DOW': '^DJI', 'NASDAQ': '^IXIC', 'VIX': '^VIX' }
    overview_data = []
    history_tickers = "^GSPC ^DJI ^IXIC"
    weekly_perf = []
    
    try:
        tickers = yf.Tickers(" ".join(indices.values()))
        for name, ticker_symbol in indices.items():
            try:
                ticker = tickers.tickers[ticker_symbol]
                info = ticker.fast_info
                price = info.last_price
                prev_close = info.previous_close
                if prev_close:
                    change = ((price - prev_close) / prev_close) * 100
                else:
                    change = 0.0
                overview_data.append({ "name": name, "value": price, "change": change })
            except:
                continue
            
        hist_data = yf.download(history_tickers, period="5d", interval="1d", progress=False)['Close']
        if not hist_data.empty:
            hist_data = hist_data.reset_index()
            for index, row in hist_data.iterrows():
                date_val = row.get('Date', None)
                if date_val:
                    date_str = date_val.strftime('%a')
                    weekly_perf.append({
                        "name": date_str,
                        "sp500": row.get('^GSPC', 0),
                        "nasdaq": row.get('^IXIC', 0),
                        "dow": row.get('^DJI', 0)
                    })

    except Exception as e:
        print(f"Indices Error: {e}")
        # Fallback data if API fails
        overview_data = [
            {"name": "S&P 500", "value": 5200, "change": 0.5},
            {"name": "DOW", "value": 39000, "change": 0.2},
            {"name": "NASDAQ", "value": 16000, "change": 0.8},
        ]

    # 2. Trending Stocks
    trending_symbols = [
        'AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 
        'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'
    ]
    trending_data = []
    try:
        t_tickers = yf.Tickers(" ".join(trending_symbols))
        for sym in trending_symbols:
            try:
                t = t_tickers.tickers[sym]
                price = t.fast_info.last_price
                prev = t.fast_info.previous_close
                
                if price is None or prev is None: continue

                change = price - prev
                pct = (change / prev) * 100
                
                display_name = sym.replace('.NS', '')
                
                trending_data.append({
                    "ticker": sym, "name": display_name, "price": price, "change": change, "changePercent": pct
                })
            except Exception: continue
    except Exception: pass

    # 3. News
    news_list = []
    try:
        market_ticker = yf.Ticker("^GSPC")
        yf_news = market_ticker.news
        if not yf_news:
             market_ticker = yf.Ticker("AAPL")
             yf_news = market_ticker.news

        for item in yf_news[:5]:
            ts = item.get('providerPublishTime', time.time())
            date_str = datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            
            summary = "Click to read full story."
            if 'relatedTickers' in item:
                summary = f"Related: {', '.join(item['relatedTickers'])}"
            
            news_list.append({
                "headline": item.get('title', 'Market News'),
                "date": date_str,
                "summary": summary,
                "source": item.get('publisher', 'Yahoo Finance'),
                "url": item.get('link', '#')
            })
    except Exception as e:
        pass

    if not news_list:
        news_list = [
            {"headline": "Market steady as tech stocks rally", "date": datetime.date.today().strftime("%Y-%m-%d"), "summary": "Positive outlook for the week.", "source": "System", "url": "#"}
        ]

    sectors = [
        { "name": 'Tech', "value": 1.5, "topStock": "NVDA" },
        { "name": 'Health', "value": -0.5, "topStock": "LLY" },
        { "name": 'Finance', "value": 0.8, "topStock": "JPM" },
        { "name": 'Energy', "value": -1.2, "topStock": "XOM" },
    ]

    return {
        "marketOverview": overview_data,
        "weekly": weekly_perf,
        "trending": trending_data,
        "news": news_list,
        "sectors": sectors
    }

# --- MAIN PREDICTION LOGIC (PyTorch) ---
def get_stock_prediction(ticker: str):
    print(f"--- Starting Analysis for {ticker} ---")
    ticker = ticker.upper().strip()
    
    # Determine Model Path
    model_path = os.path.join("saved_models", f"{ticker}_model.pth")
    
    # Download Data
    start_date = "2018-01-01"
    today = datetime.date.today()
    tomorrow_date = today + datetime.timedelta(days=1) 
    end_date = tomorrow_date.strftime('%Y-%m-%d')
    
    try:
        stock_data = yf.download(ticker, start=start_date, end=end_date, progress=False)
        if stock_data.empty:
            print(f"Data empty for {ticker}, trying {ticker}.NS...")
            ticker_ns = f"{ticker}.NS"
            stock_data = yf.download(ticker_ns, start=start_date, end=end_date, progress=False)
            if not stock_data.empty:
                ticker = ticker_ns 
                model_path = os.path.join("saved_models", f"{ticker}_model.pth")
        
        if stock_data.empty: 
            return {"error": f"No data found for {ticker}. Try adding .NS for Indian stocks."}
            
        stock_data.reset_index(inplace=True)
    except Exception as e: 
        return {"error": f"Failed to download stock data: {str(e)}"}

    # Process Data
    stock_data = flatten_columns(stock_data)
    stock_data = canonicalize_ohlcv_names(stock_data)
    if 'Date' not in stock_data.columns and 'date' in stock_data.columns:
        stock_data.rename(columns={'date':'Date'}, inplace=True)

    # Feature Engineering
    stock_data['MA5'] = stock_data['Close'].rolling(5).mean().fillna(0)
    stock_data['MA10'] = stock_data['Close'].rolling(10).mean().fillna(0)
    
    # RSI Calculation
    delta = stock_data['Close'].diff()
    up = delta.clip(lower=0)
    down = -1 * delta.clip(upper=0)
    rs = up.rolling(14).mean() / down.rolling(14).mean().replace(0, 1e-9)
    stock_data['RSI14'] = (100 - (100 / (1 + rs))).fillna(50)
    
    stock_data = stock_data.bfill().ffill()
    
    # Select Features
    feature_cols = ['Open','High','Low','Close','Volume','MA5','MA10','RSI14']
    feature_cols = [c for c in feature_cols if c in stock_data.columns]
    
    # Scaling
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(stock_data[feature_cols].values.astype(float))
    close_index = feature_cols.index('Close')
    SEQ_LEN = 60
    
    # Prepare Sequences
    X, y = [], []
    for i in range(SEQ_LEN, len(data_scaled)):
        X.append(data_scaled[i-SEQ_LEN:i])
        y.append(data_scaled[i, close_index])
    X, y = np.array(X), np.array(y)

    if len(X) == 0: return {"error": "Not enough data to train."}

    # Convert to PyTorch Tensors
    # Force CPU for Render compatibility
    device = torch.device("cpu") 
    
    X_tensor = torch.from_numpy(X).float().to(device)
    y_tensor = torch.from_numpy(y).float().to(device)

    # Train/Val Split
    split_idx = int(0.8 * len(X))
    X_train, X_val = X_tensor[:split_idx], X_tensor[split_idx:]
    y_train, y_val = y_tensor[:split_idx], y_tensor[split_idx:]

    # Initialize Model
    model = StockLSTM(input_dim=len(feature_cols), hidden_dim=64, num_layers=1, output_dim=1).to(device)
    
    # Check for existing model
    model_exists = False
    if os.path.exists(model_path):
        try:
            # Map location 'cpu' is crucial here
            model.load_state_dict(torch.load(model_path, map_location=device))
            model_exists = True
        except: pass
    
    # Train if no model exists or file is old (simple logic for now: just train if missing)
    if not model_exists:
        print(f"Training new model for {ticker}...")
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.01)
        
        model.train()
        epochs = 15 # Reduced epochs for speed on free tier
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(X_train)
            loss = criterion(outputs.squeeze(), y_train)
            loss.backward()
            optimizer.step()
        
        # Save model
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        torch.save(model.state_dict(), model_path)

    # Evaluation & Prediction
    model.eval()
    with torch.no_grad():
        y_pred = model(X_val).cpu().numpy()
        y_val_numpy = y_val.cpu().numpy()

    # Inverse Transform logic
    dummy_pred = np.zeros((len(y_pred), len(feature_cols)))
    dummy_val = np.zeros((len(y_val_numpy), len(feature_cols)))
    dummy_pred[:, close_index] = y_pred.flatten()
    dummy_val[:, close_index] = y_val_numpy.flatten()
    y_pred_inv = scaler.inverse_transform(dummy_pred)[:, close_index]
    y_val_inv = scaler.inverse_transform(dummy_val)[:, close_index]
    
    # Future Predictions (Next 3 Days)
    future_days = 3
    future_predictions = []
    current_seq_tensor = X_tensor[-1].unsqueeze(0) # Last sequence
    
    model.eval()
    for _ in range(future_days):
        with torch.no_grad():
            next_step_scaled = model(current_seq_tensor).item()
        
        # Inverse scale to get price
        dummy_future = np.zeros((1, len(feature_cols)))
        dummy_future[:, close_index] = next_step_scaled
        next_price = scaler.inverse_transform(dummy_future)[0][close_index]
        future_predictions.append(float(next_price))
        
        # Update sequence for next step
        new_row_tensor = current_seq_tensor[0, -1, :].clone()
        new_row_tensor[close_index] = next_step_scaled # Update close price
        
        # Shift sequence: Drop first, append new
        next_seq = torch.cat((current_seq_tensor[0, 1:, :], new_row_tensor.unsqueeze(0)), dim=0)
        current_seq_tensor = next_seq.unsqueeze(0)

    # Formatting Output
    start_val_idx = SEQ_LEN + split_idx
    validation_dates = stock_data['Date'].iloc[start_val_idx : start_val_idx + len(y_val)].dt.strftime('%Y-%m-%d').tolist()
    actual_prices = y_val_inv.tolist()
    predicted_prices = y_pred_inv.tolist()
    
    # Add future dates
    if validation_dates:
        last_real_date = pd.to_datetime(validation_dates[-1])
        current_date_cursor = last_real_date
        
        for price in future_predictions:
            current_date_cursor += datetime.timedelta(days=1)
            if current_date_cursor.weekday() == 5: current_date_cursor += datetime.timedelta(days=2)
            if current_date_cursor.weekday() == 6: current_date_cursor += datetime.timedelta(days=1)
            validation_dates.append(current_date_cursor.strftime('%Y-%m-%d'))
            actual_prices.append(None) # No actual data for future
            predicted_prices.append(price)

    trend = "UP" if future_predictions[-1] > future_predictions[-2] else "DOWN"
    
    return {
        "status": "success",
        "prediction_text": f"AI Analysis for {ticker}. Predicted trend: {trend}",
        "final_predicted_price": future_predictions[-1], 
        "graph_data": { "dates": validation_dates, "actual": actual_prices, "predicted": predicted_prices }
    }