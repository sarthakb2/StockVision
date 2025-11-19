import requests
from bs4 import BeautifulSoup
import datetime
import pandas as pd
import numpy as np
import yfinance as yf
import os
import time
import warnings
warnings.filterwarnings("ignore")

# NLP
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# ML / Deep Learning
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout

# Initialize NLTK
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

sia = SentimentIntensityAnalyzer()

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
    try:
        url = f"https://news.google.com/search?q={requests.utils.requote_uri(query)}&hl=en-US&gl=US&ceid=US:en"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/"
        }
        r = requests.get(url, headers=headers, timeout=10)
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
            ticker = tickers.tickers[ticker_symbol]
            info = ticker.fast_info
            price = info.last_price
            prev_close = info.previous_close
            change = ((price - prev_close) / prev_close) * 100
            
            overview_data.append({ "name": name, "value": price, "change": change })
            
        hist_data = yf.download(history_tickers, period="5d", interval="1d", progress=False)['Close']
        if not hist_data.empty:
            hist_data = hist_data.reset_index()
            for index, row in hist_data.iterrows():
                date_str = row['Date'].strftime('%a')
                weekly_perf.append({
                    "name": date_str,
                    "sp500": row.get('^GSPC', 0),
                    "nasdaq": row.get('^IXIC', 0),
                    "dow": row.get('^DJI', 0)
                })

    except Exception as e:
        print(f"Indices Error: {e}")
        overview_data = [
            {"name": "S&P 500", "value": 5000, "change": 0.0},
            {"name": "DOW", "value": 39000, "change": 0.0},
            {"name": "NASDAQ", "value": 16000, "change": 0.0},
        ]

    # 2. Trending Stocks (UPDATED: Fixed Suffixes for India)
    trending_symbols = [
        'AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN',  # US Stocks
        'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS' # Indian Stocks (.NS is standard for Yahoo)
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
                
                # Make name cleaner for display
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
        print(f"News Error: {e}")

    if not news_list:
        news_list = [
            {
                "headline": "Market data indicates steady growth in tech sector",
                "date": datetime.date.today().strftime("%Y-%m-%d"),
                "summary": "Analysts are optimistic about AI-driven stocks.",
                "source": "MarketWatch",
                "url": "#"
            }
        ]

    sectors = [
        { "name": 'Tech', "value": 1.5 },
        { "name": 'Health', "value": -0.5 },
        { "name": 'Finance', "value": 0.8 },
        { "name": 'Energy', "value": -1.2 },
        { "name": 'Consumer', "value": 0.2 },
    ]

    return {
        "marketOverview": overview_data,
        "weekly": weekly_perf,
        "trending": trending_data,
        "news": news_list,
        "sectors": sectors
    }

# --- PREDICTION LOGIC (UPDATED FOR INDIA) ---
def get_stock_prediction(ticker: str):
    print(f"--- Starting Analysis for {ticker} ---")
    
    # Clean ticker input
    ticker = ticker.upper().strip()
    
    # Define path based on sanitized ticker
    model_path = os.path.join("saved_models", f"{ticker}_model.keras")
    
    start_date = "2018-01-01"
    today = datetime.date.today()
    tomorrow_date = today + datetime.timedelta(days=1) 
    end_date = tomorrow_date.strftime('%Y-%m-%d')
    
    try:
        # 1. Try fetching directly (e.g., "AAPL" or "RELIANCE.NS")
        stock_data = yf.download(ticker, start=start_date, end=end_date, progress=False)
        
        # 2. If empty, try appending .NS for Indian stocks
        if stock_data.empty:
            print(f"Data empty for {ticker}, trying {ticker}.NS...")
            ticker_ns = f"{ticker}.NS"
            stock_data = yf.download(ticker_ns, start=start_date, end=end_date, progress=False)
            if not stock_data.empty:
                ticker = ticker_ns # Update ticker to the working one
                model_path = os.path.join("saved_models", f"{ticker}_model.keras") # Update model path
        
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

    # Sentiment (Use the cleaned ticker name for better results)
    search_query = f"{ticker} stock news"
    daily_sentiment = fetch_live_news_sentiment(search_query, head_limit=50)
    
    if daily_sentiment.empty:
        today_date = datetime.date.today()
        daily_sentiment = pd.DataFrame({"date":[today_date], "headline":[None], "Sentiment":[0.0]})
    
    daily_sentiment['date'] = pd.to_datetime(daily_sentiment['date'])
    daily_sentiment = daily_sentiment.groupby('date')['Sentiment'].mean().reset_index()
    daily_sentiment['date'] = daily_sentiment['date'].dt.normalize()
    
    stock_data['Date'] = pd.to_datetime(stock_data['Date']).dt.normalize()
    data = pd.merge(stock_data, daily_sentiment, left_on='Date', right_on='date', how='left')

    if 'Sentiment' not in data.columns and 'sentiment' in data.columns:
        data.rename(columns={'sentiment':'Sentiment'}, inplace=True)
    data['Sentiment'] = data.get('Sentiment', 0).fillna(0)
    if 'date' in data.columns: data.drop(columns=['date'], inplace=True)
    
    data['MA5'] = data['Close'].rolling(5).mean().fillna(0)
    data['MA10'] = data['Close'].rolling(10).mean().fillna(0)
    delta = data['Close'].diff()
    up = delta.clip(lower=0)
    down = -1 * delta.clip(upper=0)
    rs = up.rolling(14).mean() / down.rolling(14).mean().replace(0, 1e-9)
    data['RSI14'] = (100 - (100 / (1 + rs))).fillna(50)
    data = data.bfill().ffill()
    
    feature_cols = ['Open','High','Low','Close','Volume','Sentiment','MA5','MA10','RSI14']
    feature_cols = [c for c in feature_cols if c in data.columns]
    
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data[feature_cols].values.astype(float))
    close_index = feature_cols.index('Close')
    SEQ_LEN = 60
    
    X, y = [], []
    for i in range(SEQ_LEN, len(data_scaled)):
        X.append(data_scaled[i-SEQ_LEN:i])
        y.append(data_scaled[i, close_index])
    X, y = np.array(X), np.array(y)

    if len(X) == 0: return {"error": "Not enough data to train."}

    split_idx = int(0.8 * len(X))
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]

    model = None
    if os.path.exists(model_path):
        file_age = time.time() - os.path.getmtime(model_path)
        if file_age < 86400:
            try: model = load_model(model_path)
            except: pass
    
    if not model:
        print(f"Training new model for {ticker}...")
        model = Sequential([
            LSTM(64, return_sequences=False, input_shape=(X_train.shape[1], X_train.shape[2])),
            Dropout(0.2),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=50, batch_size=32, verbose=0)
        
        # Ensure directory exists before saving
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        model.save(model_path)

    y_pred = model.predict(X_val)
    dummy_pred = np.zeros((len(y_pred), len(feature_cols)))
    dummy_val = np.zeros((len(y_val), len(feature_cols)))
    dummy_pred[:, close_index] = y_pred.flatten()
    dummy_val[:, close_index] = y_val.flatten()
    y_pred_inv = scaler.inverse_transform(dummy_pred)[:, close_index]
    y_val_inv = scaler.inverse_transform(dummy_val)[:, close_index]
    
    future_days = 3
    future_predictions = []
    current_sequence = data_scaled[-SEQ_LEN:].copy() 
    for _ in range(future_days):
        input_seq = current_sequence.reshape(1, SEQ_LEN, len(feature_cols))
        next_step_scaled = model.predict(input_seq)[0][0]
        dummy_future = np.zeros((1, len(feature_cols)))
        dummy_future[:, close_index] = next_step_scaled
        next_price = scaler.inverse_transform(dummy_future)[0][close_index]
        future_predictions.append(float(next_price))
        new_row = current_sequence[-1].copy()
        new_row[close_index] = next_step_scaled
        current_sequence = np.append(current_sequence[1:], [new_row], axis=0)

    start_val_idx = SEQ_LEN + split_idx
    validation_dates = data['Date'].iloc[start_val_idx : start_val_idx + len(y_val)].dt.strftime('%Y-%m-%d').tolist()
    actual_prices = y_val_inv.tolist()
    predicted_prices = y_pred_inv.tolist()
    
    if validation_dates:
        last_real_date = pd.to_datetime(validation_dates[-1])
        current_date_cursor = last_real_date
        
        for price in future_predictions:
            current_date_cursor += datetime.timedelta(days=1)
            if current_date_cursor.weekday() == 5: current_date_cursor += datetime.timedelta(days=2)
            if current_date_cursor.weekday() == 6: current_date_cursor += datetime.timedelta(days=1)
            validation_dates.append(current_date_cursor.strftime('%Y-%m-%d'))
            actual_prices.append(None)
            predicted_prices.append(price)

    trend = "UP" if future_predictions[-1] > future_predictions[-2] else "DOWN"
    return {
        "status": "success",
        "prediction_text": f"Analysis for {ticker}. Trend over next 3 days: {trend}.",
        "final_predicted_price": future_predictions[-1], 
        "graph_data": { "dates": validation_dates, "actual": actual_prices, "predicted": predicted_prices }
    }