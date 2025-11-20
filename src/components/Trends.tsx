import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../api';

// --- INLINE UI COMPONENTS ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col ${className}`}>{children}</div>
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

// --- TYPES ---
interface StockItem { ticker: string; name: string; price: number; change: number; changePercent: number; }
interface SectorItem { name: string; value: number; }

const Trends: React.FC = () => {
  const navigate = useNavigate();
  
  const [trendingStocks, setTrendingStocks] = useState<StockItem[]>([]);
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data Directly
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        
        setTrendingStocks(data.trending || []);
        setSectors(data.sectors || []);
      } catch (err) {
        console.error(err);
        setError("Could not load live market data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- DATA PROCESSING ---
  const generateChartData = (changePercent: number) => {
    const isPositive = changePercent >= 0;
    let currentValue = 100;
    return Array.from({ length: 20 }, (_, i) => {
      const volatility = Math.random() * 2;
      const trend = isPositive ? 0.5 : -0.5;
      currentValue = currentValue + trend + (Math.random() - 0.5) * volatility;
      return { value: currentValue };
    });
  };

  const { indian, international, gainers, losers } = useMemo(() => {
    const safeStocks = trendingStocks || [];
    const sortedByChange = [...safeStocks].sort((a, b) => b.changePercent - a.changePercent);
    
    // UPDATED LOGIC: Check for .NS (Yahoo Finance standard for NSE)
    const isIndian = (ticker: string) => ticker.includes('.NS') || ticker.includes('.NSE') || ticker.includes('.BSE');

    return {
      indian: safeStocks.filter(s => isIndian(s.ticker)),
      international: safeStocks.filter(s => !isIndian(s.ticker)),
      gainers: sortedByChange.slice(0, 5),
      losers: sortedByChange.slice().reverse().slice(0, 5)
    };
  }, [trendingStocks]);

  const handleStockClick = (ticker: string) => {
    navigate(`/analysis?symbol=${ticker}`);
  };

  // --- RENDER HELPERS ---
  const StockCardList = ({ stocks }: { stocks: any[] }) => {
    if (!stocks || stocks.length === 0) {
      return <div className="p-6 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No data available for this category.</div>;
    }

    return (
      <div className="flex space-x-6 overflow-x-auto pb-4 px-2 scrollbar-hide">
        {stocks.map((stock, index) => {
          const chartData = generateChartData(stock.changePercent);
          return (
            <Card 
              key={`${stock.ticker}-${index}`}
              className="min-w-[280px] w-[280px] hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 dark:border-gray-800 my-1"
            >
              <div onClick={() => handleStockClick(stock.ticker)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{stock.ticker}</CardTitle>
                      <CardDescription className="truncate max-w-[150px]">{stock.name}</CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${stock.change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="text-2xl font-bold mb-3 dark:text-white">${stock.price.toFixed(2)}</div>
                  <div className="h-12 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <Line 
                          type="monotone"
                          dataKey="value"
                          stroke={stock.change >= 0 ? '#10b981' : '#ef4444'}
                          dot={false}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </div>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full text-gray-500 hover:text-blue-600" onClick={(e: any) => {
                  e.stopPropagation();
                  handleStockClick(stock.ticker);
                }}>
                  View Analysis
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading market trends...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="text-blue-600 h-6 w-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Stocks</h1>
      </div>
      <p className="text-gray-500 mb-8">Track current market movements and popular stocks</p>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      
      {/* Market Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader><CardTitle className="text-green-600">Top Gainers</CardTitle></CardHeader>
          <CardContent>
             <div className="space-y-3">
               {gainers.length > 0 ? gainers.map((stock, i) => (
                 <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer" onClick={() => handleStockClick(stock.ticker)}>
                    <div><div className="font-medium">{stock.ticker}</div><div className="text-xs text-gray-500">{stock.name}</div></div>
                    <div className="text-right"><div className="font-medium">${stock.price.toFixed(2)}</div><div className="text-xs text-green-600">+{stock.changePercent.toFixed(2)}%</div></div>
                 </div>
               )) : <div className="text-gray-400 text-sm">No data</div>}
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-red-600">Top Losers</CardTitle></CardHeader>
          <CardContent>
             <div className="space-y-3">
               {losers.length > 0 ? losers.map((stock, i) => (
                 <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer" onClick={() => handleStockClick(stock.ticker)}>
                    <div><div className="font-medium">{stock.ticker}</div><div className="text-xs text-gray-500">{stock.name}</div></div>
                    <div className="text-right"><div className="font-medium">${stock.price.toFixed(2)}</div><div className="text-xs text-red-600">{stock.changePercent.toFixed(2)}%</div></div>
                 </div>
               )) : <div className="text-gray-400 text-sm">No data</div>}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* International Market Trends */}
      <div className="mb-8">
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0">
            <div className="flex justify-between items-center ml-5">
              <div>
                <CardTitle className="text-2xl">🌎 International Market</CardTitle>
                <CardDescription>Trending stocks in global markets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 ml-5 mr-5">
            <StockCardList stocks={international} />
          </CardContent>
        </Card>
      </div>
      
      {/* Indian Market Trends */}
      <div className="mb-8">
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0">
            <div className="flex justify-between items-center ml-5">
              <div>
                <CardTitle className="text-2xl">🇮🇳 Indian Market</CardTitle>
                <CardDescription>Trending stocks in the Indian stock market</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 ml-5 mr-5">
            <StockCardList stocks={indian} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Trends;