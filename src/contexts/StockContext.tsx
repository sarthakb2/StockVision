import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Mock stock data
const MOCK_STOCK_DATA = {
  AAPL: {
    name: "Apple Inc.",
    ticker: "AAPL",
    price: 182.63,
    change: 1.25,
    changePercent: 0.69,
    marketCap: "2.87T",
    volume: "48.12M",
    peRatio: 28.5,
    yearHigh: 199.62,
    yearLow: 143.90,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(140, 170 + Math.sin(i / 20) * 30 + Math.random() * 10)
    }))
  },
  MSFT: {
    name: "Microsoft Corporation",
    ticker: "MSFT",
    price: 337.21,
    change: 3.84,
    changePercent: 1.15,
    marketCap: "2.51T",
    volume: "22.36M",
    peRatio: 32.7,
    yearHigh: 352.71,
    yearLow: 241.51,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(230, 290 + Math.cos(i / 25) * 35 + Math.random() * 12)
    }))
  },
  GOOGL: {
    name: "Alphabet Inc.",
    ticker: "GOOGL",
    price: 131.86,
    change: 1.27,
    changePercent: 0.97,
    marketCap: "1.67T",
    volume: "24.52M",
    peRatio: 25.1,
    yearHigh: 153.78,
    yearLow: 102.02,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(95, 125 + Math.sin(i / 30) * 25 + Math.random() * 8)
    }))
  },
  AMZN: {
    name: "Amazon.com, Inc.",
    ticker: "AMZN",
    price: 127.74,
    change: -0.69,
    changePercent: -0.54,
    marketCap: "1.32T",
    volume: "39.14M",
    peRatio: 67.2,
    yearHigh: 149.26,
    yearLow: 88.12,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(85, 115 + Math.sin(i / 15) * 20 + Math.random() * 15)
    }))
  },
  TSLA: {
    name: "Tesla, Inc.",
    ticker: "TSLA", 
    price: 196.42,
    change: 5.31,
    changePercent: 2.78,
    marketCap: "624.1B",
    volume: "118.22M",
    peRatio: 50.3,
    yearHigh: 299.29,
    yearLow: 152.31,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(140, 200 + Math.cos(i / 10) * 50 + Math.random() * 20)
    }))
  },
  NFLX: {
    name: "Netflix, Inc.",
    ticker: "NFLX",
    price: 476.35,
    change: 8.74,
    changePercent: 1.87,
    marketCap: "207.5B",
    volume: "3.09M",
    peRatio: 41.8,
    yearHigh: 634.78,
    yearLow: 290.11,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(280, 450 + Math.sin(i / 18) * 90 + Math.random() * 25)
    }))
  },
  FB: {
    name: "Meta Platforms, Inc.",
    ticker: "META",
    price: 295.18,
    change: 2.35,
    changePercent: 0.80,
    marketCap: "762.3B",
    volume: "14.32M",
    peRatio: 29.2,
    yearHigh: 384.33,
    yearLow: 179.11,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(170, 250 + Math.cos(i / 20) * 70 + Math.random() * 18)
    }))
  },
  NVDA: {
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    price: 418.76,
    change: 10.94,
    changePercent: 2.68,
    marketCap: "1.03T",
    volume: "47.36M",
    peRatio: 78.5,
    yearHigh: 502.66,
    yearLow: 118.90,
    history: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      close: Math.max(110, 300 + Math.sin(i / 15) * 150 + Math.random() * 30)
    }))
  },
};

// Indian market stocks
const INDIAN_STOCKS = [
  { name: "Reliance Industries", ticker: "RELIANCE.NS", price: 2467.55, change: 32.85, changePercent: 1.35 },
  { name: "HDFC Bank", ticker: "HDFCBANK.NS", price: 1678.90, change: -12.35, changePercent: -0.73 },
  { name: "Infosys", ticker: "INFY.NS", price: 1432.75, change: 15.80, changePercent: 1.12 },
  { name: "TCS", ticker: "TCS.NS", price: 3478.25, change: 28.65, changePercent: 0.83 },
  { name: "ICICI Bank", ticker: "ICICIBANK.NS", price: 954.70, change: -3.20, changePercent: -0.33 },
];

// International market stocks (besides US)
const INTERNATIONAL_STOCKS = [
  { name: "Toyota Motor", ticker: "7203.T", price: 2415.00, change: 45.50, changePercent: 1.92 },
  { name: "Samsung Electronics", ticker: "005930.KS", price: 71800.00, change: 1400.00, changePercent: 1.99 },
  { name: "HSBC Holdings", ticker: "HSBA.L", price: 655.80, change: -3.30, changePercent: -0.50 },
  { name: "Alibaba Group", ticker: "9988.HK", price: 81.45, change: 1.15, changePercent: 1.43 },
  { name: "Nestle", ticker: "NESN.SW", price: 105.44, change: 0.76, changePercent: 0.73 },
];

interface MarketNews {
  id: string;
  date: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  liked?: boolean;
  saved?: boolean;
}

const MOCK_NEWS: MarketNews[] = [
  {
    id: "news1",
    date: new Date().toISOString(),
    headline: "Fed Signals Potential Interest Rate Cut",
    summary: "Federal Reserve officials indicated they're getting closer to cutting interest rates as inflation continues to cool, minutes from their latest meeting showed.",
    source: "Financial Times",
    url: "#"
  },
  {
    id: "news2",
    date: new Date(Date.now() - 86400000).toISOString(),
    headline: "Tech Stocks Rally on Strong Earnings Reports",
    summary: "Major technology companies exceeded analyst expectations in their quarterly reports, driving a broad market rally.",
    source: "Wall Street Journal",
    url: "#"
  },
  {
    id: "news3",
    date: new Date(Date.now() - 172800000).toISOString(),
    headline: "Oil Prices Drop Amid Supply Concerns",
    summary: "Crude oil prices fell by over 3% as OPEC+ members discussed potential production increases and global demand forecasts weakened.",
    source: "Bloomberg",
    url: "#"
  },
  {
    id: "news4",
    date: new Date(Date.now() - 259200000).toISOString(),
    headline: "Retail Sales Show Unexpected Growth",
    summary: "Consumer spending rose more than expected last month, suggesting economic resilience despite inflation pressures.",
    source: "CNBC",
    url: "#"
  },
  {
    id: "news5",
    date: new Date(Date.now() - 345600000).toISOString(),
    headline: "New AI Chip Development Boosts Semiconductor Sector",
    summary: "Shares of semiconductor companies surged following announcements of breakthrough AI chip technologies from industry leaders.",
    source: "Reuters",
    url: "#"
  },
  {
    id: "news6",
    date: new Date(Date.now() - 432000000).toISOString(),
    headline: "Housing Market Shows Signs of Cooling",
    summary: "Home sales dropped for the third consecutive month as mortgage rates remained elevated, potentially signaling a shift in the real estate market.",
    source: "Associated Press",
    url: "#"
  }
];

interface Stock {
  name: string;
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: string;
  volume?: string;
  peRatio?: number;
  yearHigh?: number;
  yearLow?: number;
  history?: {
    date: string;
    close: number;
  }[];
}

interface StockData {
  [key: string]: Stock;
}

interface Portfolio {
  savedStocks: string[];
  likedNews: string[];
}

interface StockContextType {
  stockData: StockData;
  getStockData: (ticker: string) => Stock | null;
  searchStocks: (query: string) => Stock[];
  trendingStocks: {
    indian: Stock[];
    international: Stock[];
  };
  news: MarketNews[];
  likeNews: (id: string) => void;
  saveNews: (id: string) => void;
  saveStock: (ticker: string) => void;
  unsaveStock: (ticker: string) => void;
  portfolio: Portfolio;
  loading: boolean;
}

const StockContext = createContext<StockContextType>({
  stockData: {},
  getStockData: () => null,
  searchStocks: () => [],
  trendingStocks: {
    indian: [],
    international: []
  },
  news: [],
  likeNews: () => {},
  saveNews: () => {},
  saveStock: () => {},
  unsaveStock: () => {},
  portfolio: {
    savedStocks: [],
    likedNews: []
  },
  loading: false
});

export const useStock = () => useContext(StockContext);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockData, setStockData] = useState<StockData>(MOCK_STOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<MarketNews[]>(MOCK_NEWS);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    savedStocks: [],
    likedNews: []
  });
  
  // Load portfolio from localStorage
  React.useEffect(() => {
    const savedPortfolio = localStorage.getItem('stockay_portfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
  }, []);
  
  // Save portfolio to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('stockay_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);
  
  const getStockData = useCallback((ticker: string) => {
    console.log('Getting stock data for:', ticker);
    
    if (!ticker) {
      console.log('No ticker provided');
      return null;
    }
    
    // First try to get from main stockData
    if (stockData[ticker]) {
      console.log('Found in main stock data');
      return stockData[ticker];
    }
    
    // If not found, check Indian stocks
    const indianStock = INDIAN_STOCKS.find(stock => stock.ticker === ticker);
    if (indianStock) {
      console.log('Found in Indian stocks');
      return indianStock;
    }
    
    // If not found, check international stocks
    const internationalStock = INTERNATIONAL_STOCKS.find(stock => stock.ticker === ticker);
    if (internationalStock) {
      console.log('Found in international stocks');
      return internationalStock;
    }
    
    // If not found anywhere, generate a basic placeholder stock
    if (ticker && ticker.length > 0) {
      console.log('Generating mock data for:', ticker);
      // Generate mock data for stocks not in our predefined lists
      const generatedStock: Stock = {
        name: `${ticker} Corporation`,
        ticker: ticker,
        price: 100 + Math.random() * 200,
        change: Math.random() * 10 - 5,
        changePercent: Math.random() * 5 - 2.5,
        marketCap: `${Math.floor(Math.random() * 500)}B`,
        volume: `${Math.floor(Math.random() * 50)}M`,
        peRatio: 15 + Math.random() * 30,
        yearHigh: 200 + Math.random() * 300,
        yearLow: 50 + Math.random() * 100,
        history: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
          close: 100 + Math.sin(i / 20) * 30 + Math.random() * 40
        }))
      };
      
      // Add the generated stock to our stockData
      setStockData(prevData => ({
        ...prevData,
        [ticker]: generatedStock
      }));
      
      return generatedStock;
    }
    
    return null;
  }, [stockData]);
  
  const searchStocks = (query: string) => {
    if (!query) return [];
    
    query = query.toLowerCase();
    return Object.values(stockData)
      .filter(stock => 
        stock.name.toLowerCase().includes(query) || 
        stock.ticker.toLowerCase().includes(query)
      );
  };
  
  const likeNews = (id: string) => {
    if (portfolio.likedNews.includes(id)) {
      setPortfolio({
        ...portfolio,
        likedNews: portfolio.likedNews.filter(newsId => newsId !== id)
      });
    } else {
      setPortfolio({
        ...portfolio,
        likedNews: [...portfolio.likedNews, id]
      });
    }
    
    setNews(news.map(item => 
      item.id === id 
        ? { ...item, liked: !item.liked } 
        : item
    ));
  };
  
  const saveNews = (id: string) => {
    setNews(news.map(item => 
      item.id === id 
        ? { ...item, saved: !item.saved } 
        : item
    ));
  };
  
  const saveStock = (ticker: string) => {
    if (!portfolio.savedStocks.includes(ticker)) {
      setPortfolio({
        ...portfolio,
        savedStocks: [...portfolio.savedStocks, ticker]
      });
    }
  };
  
  const unsaveStock = (ticker: string) => {
    setPortfolio({
      ...portfolio,
      savedStocks: portfolio.savedStocks.filter(t => t !== ticker)
    });
  };

  return (
    <StockContext.Provider value={{
      stockData,
      getStockData,
      searchStocks,
      trendingStocks: {
        indian: INDIAN_STOCKS,
        international: INTERNATIONAL_STOCKS
      },
      news,
      likeNews,
      saveNews,
      saveStock,
      unsaveStock,
      portfolio,
      loading
    }}>
      {children}
    </StockContext.Provider>
  );
};
