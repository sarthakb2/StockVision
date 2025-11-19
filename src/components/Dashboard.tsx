import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend 
} from 'recharts';
import { 
  ArrowRight, TrendingUp, BookMarked, Newspaper, Eye, RefreshCcw, AlertCircle, 
  ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, ChevronRight, ExternalLink
} from 'lucide-react';

// --- 1. INLINE UI COMPONENTS ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);
const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}>{children}</p>
);
const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 flex-1 ${className}`}>{children}</div>
);
const CardFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
);
const Button = ({ children, variant = "primary", size = "default", className = "", disabled, onClick, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow",
    outline: "border border-gray-200 bg-transparent hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
  };
  const sizes = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3" };
  return (
    <button 
      className={`${baseStyles} ${variants[variant as keyof typeof variants] || variants.primary} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      disabled={disabled} onClick={onClick} {...props}
    >
      {children}
    </button>
  );
};
const Input = ({ className = "", ...props }: any) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-50 ${className}`}
    {...props}
  />
);
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 ${className}`}>
        {children}
    </span>
);

// --- 2. TYPES & MOCK DATA ---
interface MarketItem { name: string; value: number; change: number; }
interface StockItem { ticker: string; name: string; price: number; change: number; changePercent: number; }
interface NewsItem { 
  id?: string; 
  headline: string; 
  date: string; 
  summary: string; 
  source: string; 
  url?: string; 
  liked?: boolean; 
  saved?: boolean; 
}
interface DashboardData {
  marketOverview: MarketItem[];
  trending: StockItem[];
  news: NewsItem[];
  weekly: any[];
  sectors: any[];
}

const MOCK_DATA: DashboardData = {
  marketOverview: [
    { name: 'S&P 500', value: 4582.64, change: +0.98 },
    { name: 'DOW', value: 38563.12, change: +0.45 },
    { name: 'NASDAQ', value: 15690.50, change: +1.25 },
    { name: 'VIX', value: 16.38, change: -5.02 },
  ],
  trending: [
    { ticker: 'AAPL', name: 'Apple Inc.', price: 175.30, change: 2.5, changePercent: 1.45 },
    { ticker: 'NVDA', name: 'NVIDIA Corp', price: 875.20, change: 15.30, changePercent: 1.8 },
    { ticker: 'MSFT', name: 'Microsoft', price: 402.10, change: -1.20, changePercent: -0.3 },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: 170.50, change: 5.10, changePercent: 3.1 },
    { ticker: 'AMZN', name: 'Amazon.com', price: 178.15, change: 1.15, changePercent: 0.65 },
  ],
  news: [
    { id: "1", headline: "Fed Signals Potential Rate Cuts", date: new Date().toISOString(), summary: "The Federal Reserve indicated potential rate cuts later this year.", source: "Financial Times", url: "#" },
    { id: "2", headline: "Tech Sector Rally Continues", date: new Date().toISOString(), summary: "Major tech stocks hit new all-time highs driven by AI demand.", source: "Bloomberg", url: "#" },
    { id: "3", headline: "Global Oil Prices Stabilize", date: new Date().toISOString(), summary: "Crude oil prices remain steady amidst geopolitical tensions.", source: "Reuters", url: "#" }
  ],
  weekly: [
    { name: 'Mon', sp500: 4520, nasdaq: 15520, dow: 38200 },
    { name: 'Tue', sp500: 4530, nasdaq: 15580, dow: 38300 },
    { name: 'Wed', sp500: 4540, nasdaq: 15600, dow: 38400 },
    { name: 'Thu', sp500: 4550, nasdaq: 15650, dow: 38450 },
    { name: 'Fri', sp500: 4582, nasdaq: 15690, dow: 38563 },
  ],
  sectors: [
    { name: 'Tech', value: 4.2 },
    { name: 'Health', value: 1.8 },
    { name: 'Finance', value: 0.9 },
    { name: 'Retail', value: -0.5 },
    { name: 'Energy', value: -1.2 },
  ]
};

const useAuth = () => ({ user: { name: 'Trader' } });

// --- 3. PAGE COMPONENTS ---

const Visions: React.FC = () => {
  const [stockName, setStockName] = useState<string>("");
  const [result, setResult] = useState<any | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockName) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_name: stockName.toUpperCase() }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || data.detail || "Failed to get prediction");
      setResult(data);
      if (data.graph_data) {
        const formattedData = data.graph_data.dates.map((date: string, index: number) => ({
          date,
          Actual: data.graph_data.actual[index],
          Predicted: data.graph_data.predicted[index],
        }));
        setChartData(formattedData);
      }
    } catch (err: any) {
      console.error("Prediction Error:", err);
      setError(err.message || "An error occurred while connecting to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">AI Stock Vision</h1>
        <p className="text-gray-500 dark:text-gray-400">Powered by LSTM Neural Networks & VADER Sentiment Analysis</p>
      </div>
      <Card className="max-w-2xl mx-auto border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <form onSubmit={handlePrediction} className="flex gap-4">
            <Input value={stockName} onChange={(e: any) => setStockName(e.target.value)} placeholder="Enter Symbol (e.g. AAPL, TSLA)" className="flex-1 bg-white dark:bg-gray-900" disabled={isLoading} />
            <Button type="submit" disabled={isLoading} className="w-32">{isLoading ? "Thinking..." : "Predict"}</Button>
          </form>
        </CardContent>
      </Card>
      {error && <div className="max-w-2xl mx-auto p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center">{error}</div>}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30">
            <CardHeader><CardTitle>Analysis for {stockName.toUpperCase()}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">{result.prediction_text}</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-[200px]">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Predicted Price</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${result.final_predicted_price.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Price Trajectory</CardTitle><CardDescription>Actual market close vs AI predicted path</CardDescription></CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={30} stroke="#888888" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} width={60} stroke="#888888" tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", border: "1px solid #e5e7eb" }} labelStyle={{ color: "#374151", fontWeight: "bold" }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="Actual" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Actual Price" />
                  <Line type="monotone" dataKey="Predicted" stroke="#f97316" strokeWidth={2.5} dot={false} strokeDasharray="5 5" name="AI Prediction" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="flex justify-center pt-8">
        <Link to="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    </div>
  );
};

const Market: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/dashboard');
        if (response.ok) {
          const data = await response.json();
          const formattedNews = data.news.map((n: any, i: number) => ({
            ...n, id: i.toString(), liked: false, saved: false
          }));
          setNews(formattedNews.length > 0 ? formattedNews : MOCK_DATA.news);
        } else {
          setNews(MOCK_DATA.news);
        }
      } catch (e) {
        setNews(MOCK_DATA.news);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleInteraction = (id: string, type: 'like' | 'save') => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, [type === 'like' ? 'liked' : 'saved']: !n[type === 'like' ? 'liked' : 'saved'] } : n));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Financial Market News</h1>
          <p className="text-gray-500">Stay informed with the latest updates and insights</p>
        </div>
        <Link to="/dashboard"><Button variant="outline">Dashboard</Button></Link>
      </div>

      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-6">
          {['all', 'trending', 'market', 'stocks'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'all' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {loading ? <div className="col-span-3 text-center py-12">Loading news...</div> : news.map((item) => (
              <Card key={item.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">
                       <h3 className="font-bold text-lg leading-snug text-gray-900 dark:text-white line-clamp-2">{item.headline}</h3>
                    </a>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Badge>{item.source}</Badge>
                    <span className="ml-auto">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-4">{item.summary}</p>
                  {item.url && item.url !== '#' && (
                     <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-2 flex items-center gap-1 hover:underline">Read full story <ExternalLink className="h-3 w-3"/></a>
                  )}
                </div>
                <CardFooter className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleInteraction(item.id, 'like')} className={item.liked ? 'text-blue-600' : 'text-gray-500'}><ThumbsUp className="h-4 w-4 mr-1" /></Button>
                      <Button variant="ghost" size="sm" className="text-gray-500"><ThumbsDown className="h-4 w-4 mr-1" /></Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleInteraction(item.id, 'save')} className={item.saved ? 'text-blue-600' : 'text-gray-500'}>
                       {item.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Coming Soon</h3>
            <p className="text-gray-500">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.warn("Backend offline, using mock data");
      setData(MOCK_DATA);
      setError("Live connection failed. Showing demo data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleStockClick = (ticker: string) => navigate(`/analysis?symbol=${ticker}`);
  const marketOverview = data?.marketOverview || [];
  const trendingStocks = data?.trending || [];
  const weeklyPerformance = data?.weekly || [];
  const sectorPerformance = data?.sectors || [];

  // Date formatter helper
  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));
    } catch(e) { return dateStr; }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Live financial overview & AI insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-6 border border-yellow-200 flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4" /> <span>{error} <span className="underline cursor-pointer font-semibold ml-1" onClick={fetchDashboardData}>Retry</span></span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/visions" className="block h-full">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-white border-blue-200 dark:from-blue-900/20 dark:to-gray-900 dark:border-blue-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-400"><Eye className="h-5 w-5" /> AI Visions</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 dark:text-gray-300">Predict future market trends with Deep Learning.</p></CardContent>
            <CardFooter><Button variant="ghost" size="sm" className="w-full justify-between text-blue-600 dark:text-blue-400">See Predictions <ArrowRight className="h-4 w-4" /></Button></CardFooter>
          </Card>
        </Link>
        <Link to="/analysis" className="block h-full">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5" /> Analysis</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-500">Deep dive technical analysis.</p></CardContent>
            <CardFooter><Button variant="ghost" size="sm" className="w-full justify-between">Analyze <ArrowRight className="h-4 w-4" /></Button></CardFooter>
          </Card>
        </Link>
        <Link to="/portfolio" className="block h-full">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BookMarked className="h-5 w-5" /> Portfolio</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-500">Manage holdings and watchlists.</p></CardContent>
            <CardFooter><Button variant="ghost" size="sm" className="w-full justify-between">View <ArrowRight className="h-4 w-4" /></Button></CardFooter>
          </Card>
        </Link>
        <Link to="/market" className="block h-full">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Newspaper className="h-5 w-5" /> News</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-500">Latest financial headlines.</p></CardContent>
            <CardFooter><Button variant="ghost" size="sm" className="w-full justify-between">Read <ArrowRight className="h-4 w-4" /></Button></CardFooter>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {marketOverview.map((item: any, index: number) => (
          <Card key={index}>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-base text-gray-500">{item.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className={`text-sm font-medium mt-1 ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="min-h-[400px]">
          <CardHeader><CardTitle>Weekly Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="sp500" stroke="#2563eb" strokeWidth={2} dot={false} name="S&P 500" />
                  <Line type="monotone" dataKey="nasdaq" stroke="#10b981" strokeWidth={2} dot={false} name="NASDAQ" />
                  <Line type="monotone" dataKey="dow" stroke="#8b5cf6" strokeWidth={2} dot={false} name="DOW" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[400px]">
          <CardHeader><CardTitle>Sector Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Performance (%)">
                    {sectorPerformance.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UPDATED SECTION: Removed Latest News, Made Trending Stocks Full Width */}
      <div className="grid grid-cols-1 gap-8">
        {/* Trending Stocks */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Trending Stocks</CardTitle>
                <CardDescription>Most active by volume</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {trendingStocks.slice(0, 5).map((stock: any, index: number) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleStockClick(stock.ticker)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
                      {stock.ticker[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{stock.ticker}</div>
                      <div className="text-xs text-gray-500">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right"><div className="font-medium text-sm">${stock.price.toFixed(2)}</div><div className={`text-xs font-medium ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</div></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;