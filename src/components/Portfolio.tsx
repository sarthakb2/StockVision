import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';
import { 
  BookmarkCheck, FileDown, Trash2, Plus, ExternalLink, Wallet, TrendingUp, TrendingDown, PieChart as PieIcon, X
} from 'lucide-react';

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
const Button = ({ children, variant = "primary", size = "default", className = "", onClick, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 cursor-pointer";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow",
    outline: "border border-gray-200 bg-transparent hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    destructive: "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
  };
  const sizes = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", icon: "h-9 w-9" };
  return (
    <button 
      className={`${baseStyles} ${variants[variant as keyof typeof variants] || variants.primary} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      onClick={onClick} {...props}
    >
      {children}
    </button>
  );
};

// --- TYPES & MOCK DATA ---
interface PortfolioItem {
  ticker: string;
  name: string;
  price: number;
  shares: number;
  change: number;
  changePercent: number;
  type: string;
}

const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: 175.30, shares: 10, change: 2.5, changePercent: 1.45, type: 'Tech' },
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: 875.20, shares: 5, change: 15.30, changePercent: 1.8, type: 'Tech' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  
  // Load from localStorage or use default
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('userPortfolio');
    return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'holdings'>('overview');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newShares, setNewShares] = useState('1');
  const [addError, setAddError] = useState('');

  // Save to localStorage whenever portfolio changes
  useEffect(() => {
    localStorage.setItem('userPortfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // --- ACTIONS ---

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker) {
      setAddError('Please enter a ticker symbol');
      return;
    }

    // Check if already exists
    if (portfolio.find(p => p.ticker === newTicker.toUpperCase())) {
      setAddError('Stock already in portfolio');
      return;
    }

    // Simulate fetching data (In a real app, you'd call your API here)
    const mockPrice = Math.random() * 500 + 50;
    const mockChange = (Math.random() - 0.5) * 10;
    
    const newStock: PortfolioItem = {
      ticker: newTicker.toUpperCase(),
      name: `${newTicker.toUpperCase()} Corp`, // Mock name
      price: mockPrice,
      shares: parseInt(newShares) || 1,
      change: mockChange,
      changePercent: (mockChange / mockPrice) * 100,
      type: 'Tech' // Default type
    };

    setPortfolio([...portfolio, newStock]);
    setIsModalOpen(false);
    setNewTicker('');
    setNewShares('1');
    setAddError('');
  };

  const handleRemoveStock = (ticker: string) => {
    setPortfolio(prev => prev.filter(s => s.ticker !== ticker));
  };

  // --- CALCULATIONS ---
  const totalValue = useMemo(() => {
    return portfolio.reduce((acc, stock) => acc + (stock.price * stock.shares), 0);
  }, [portfolio]);

  const dayChangeValue = useMemo(() => {
    return portfolio.reduce((acc, stock) => acc + (stock.change * stock.shares), 0);
  }, [portfolio]);

  const allocationData = useMemo(() => {
    return portfolio.map(stock => ({
      name: stock.ticker,
      value: stock.price * stock.shares
    }));
  }, [portfolio]);

  const performanceData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i,
      value: totalValue * (0.9 + Math.random() * 0.2)
    }));
  }, [totalValue]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500 relative">
      
      {/* --- ADD STOCK MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Holding</CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticker Symbol</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GOOGL" 
                    className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shares Owned</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                  />
                </div>
                {addError && <p className="text-sm text-red-500">{addError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Add to Portfolio</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-blue-600 h-8 w-8" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Portfolio</h1>
          </div>
          <p className="text-gray-500">Track your investments and asset allocation.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Stock
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'holdings' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
        >
          Holdings ({portfolio.length})
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Balance</p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-500">Day Change</p>
                <div className={`flex items-center mt-2 ${dayChangeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dayChangeValue >= 0 ? <TrendingUp className="h-5 w-5 mr-2" /> : <TrendingDown className="h-5 w-5 mr-2" />}
                  <span className="text-2xl font-bold">
                    {dayChangeValue >= 0 ? '+' : ''}${Math.abs(dayChangeValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-500">Total Assets</p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{portfolio.length}</h2>
              </CardContent>
            </Card>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Performance Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Estimated value over last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <XAxis dataKey="day" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Allocation Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieIcon className="h-4 w-4" /> Allocation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {allocationData.map((entry, index) => (
                    <div key={index} className="flex justify-between text-sm items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="font-medium">{entry.name}</span>
                      </div>
                      <span className="text-gray-500">{((entry.value / totalValue) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Holdings List View */
        <div className="grid gap-4">
          {portfolio.length === 0 ? (
             <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
               <BookmarkCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
               <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your portfolio is empty</h3>
               <p className="text-gray-500 mb-6">Add stocks to start tracking your wealth.</p>
               <Button onClick={() => setIsModalOpen(true)}>Add Stock</Button>
             </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Ticker</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-right">Shares</th>
                      <th className="px-6 py-3 text-right">Total Value</th>
                      <th className="px-6 py-3 text-right">Change</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((stock) => (
                      <tr key={stock.ticker} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{stock.ticker}</td>
                        <td className="px-6 py-4 text-gray-500">{stock.name}</td>
                        <td className="px-6 py-4 text-right font-medium">${stock.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">{stock.shares}</td>
                        <td className="px-6 py-4 text-right font-bold">${(stock.price * stock.shares).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`px-6 py-4 text-right font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/analysis?symbol=${stock.ticker}`)} title="Analyze">
                              <ExternalLink className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleRemoveStock(stock.ticker)} title="Remove">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Portfolio;