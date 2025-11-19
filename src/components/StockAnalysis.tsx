import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- CONFIGURATION ---
const TIME_RANGES = {
  "1W": 7,
  "1M": 30,
  "6M": 182,
  "1Y": 365,
};

const chartColors = [
  "#FF0000",
  "#00BFFF",
  "#32CD32",
  "#FFA500",
  "#9370DB",
  "#00CED1",
  "#FFC0CB",
];

// --- TYPES ---
type StockSummary = {
  symbol: string;
  shortName?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  dividendYield?: number;
  peRatio?: number;
};

type StockDataPoint = { date: string; price: number };

// --- MOCK DATA GENERATOR (For testing without backend) ---
const generateMockData = (symbol: string, days: number): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  let price = Math.random() * 100 + 50; // Random start price
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    price = price + (Math.random() - 0.5) * 5; // Random daily movement
    data.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

const generateMockSummary = (symbol: string): StockSummary => ({
  symbol,
  shortName: `${symbol} Corp`,
  price: Math.random() * 200 + 100,
  change: Math.random() * 10 - 5,
  changePercent: Math.random() * 5 - 2.5,
  marketCap: 2500000000000,
  fiftyTwoWeekHigh: 300,
  fiftyTwoWeekLow: 150,
  peRatio: 35.5,
});

// --- COMPONENT ---
export default function StockAnalysis() {
  const [symbols, setSymbols] = useState<string[]>(["AAPL"]); // Start with one default
  const [input, setInput] = useState("");
  const [stockData, setStockData] = useState<Record<string, StockDataPoint[]>>(
    {}
  );
  const [stockSummaries, setStockSummaries] = useState<
    Record<string, StockSummary>
  >({});
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "6M" | "1Y">("1M");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const STOCK_SYMBOLS = [
    "AAPL",
    "GOOGL",
    "MSFT",
    "AMZN",
    "TSLA",
    "META",
    "NVDA",
    "RELIANCE.NSE",
    "TATAMOTORS.NSE",
    "INFY.NSE",
    "HDFCBANK.NSE",
    "ICICIBANK.NSE",
  ];

  // --- HANDLERS ---

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle suggestions filtering
  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    const filtered = STOCK_SYMBOLS.filter(
      (sym) =>
        sym.toLowerCase().startsWith(input.toLowerCase()) &&
        !symbols.includes(sym)
    ).slice(0, 10);
    setSuggestions(filtered);
  }, [input, symbols]);

  // --- DATA FETCHING ---

  const fetchStockData = async (symbol: string) => {
    try {
      // Try fetching from your local API
      // const response = await axios.get(`http://localhost:4000/api/stock?symbol=${symbol}`);
      // return parseTimeSeries(response.data['Time Series (Daily)']);

      // FALLBACK: Use Mock Data if API fails/is missing
      console.log(`Fetching mock data for ${symbol}...`);
      await new Promise((res) => setTimeout(res, 500)); // Fake delay
      return generateMockData(symbol, 365);
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      return [];
    }
  };

  const fetchStockSummary = async (symbol: string) => {
    try {
      // Try fetching from your local API
      // const response = await axios.get(`http://localhost:4000/api/stock/summary?symbol=${symbol}`);
      // return response.data;

      // FALLBACK
      return generateMockSummary(symbol);
    } catch (error) {
      console.error(`Error fetching summary for ${symbol}:`, error);
      return null;
    }
  };

  // --- CHART LOGIC ---

  const filterByTimeRange = (data: StockDataPoint[], days: number) => {
    if (!data || !data.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter((d) => new Date(d.date) >= cutoff);
  };

  const combineChartData = (
    currentSymbols: string[],
    currentData: Record<string, StockDataPoint[]>,
    days: number
  ) => {
    if (currentSymbols.length === 0) return [];

    // 1. Collect all unique dates from all symbols in range
    const allDatesSet = new Set<string>();
    currentSymbols.forEach((sym) => {
      const filtered = filterByTimeRange(currentData[sym] || [], days);
      filtered.forEach((d) => allDatesSet.add(d.date));
    });

    if (allDatesSet.size === 0) return [];

    // 2. Sort dates
    const allDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // 3. Map dates to object { date: '2023-01-01', AAPL: 150, MSFT: 300 }
    return allDates.map((date) => {
      const row: any = { date };
      currentSymbols.forEach((sym) => {
        // Find the price for this symbol on this specific date
        const symbolData = filterByTimeRange(currentData[sym] || [], days);
        const point = symbolData.find((d) => d.date === date);
        row[sym] = point ? point.price : null;
      });
      return row;
    });
  };

  // Load data whenever symbols change
  useEffect(() => {
    if (symbols.length === 0) {
      setStockData({});
      setStockSummaries({});
      return;
    }

    const loadData = async () => {
      setLoading(true);

      // Fetch Chart Data
      const dataPromises = symbols.map(async (sym) => {
        // Only fetch if we don't already have it
        if (stockData[sym]) return { symbol: sym, data: stockData[sym] };
        const data = await fetchStockData(sym);
        return { symbol: sym, data };
      });

      // Fetch Summary Data
      const summaryPromises = symbols.map(async (sym) => {
        if (stockSummaries[sym])
          return { symbol: sym, summary: stockSummaries[sym] };
        const summary = await fetchStockSummary(sym);
        return { symbol: sym, summary };
      });

      const chartResults = await Promise.all(dataPromises);
      const summaryResults = await Promise.all(summaryPromises);

      setStockData((prev) => {
        const next = { ...prev };
        chartResults.forEach((res) => {
          next[res.symbol] = res.data;
        });
        return next;
      });

      setStockSummaries((prev) => {
        const next = { ...prev };
        summaryResults.forEach((res) => {
          if (res.summary) next[res.symbol] = res.summary;
        });
        return next;
      });

      setLoading(false);
    };

    loadData();
  }, [symbols]); // Only re-run if symbols array changes

  const handleAddSymbol = (symbol?: string) => {
    const sym = (symbol ?? input).trim().toUpperCase();
    if (sym && !symbols.includes(sym)) {
      setSymbols((prev) => [...prev, sym]);
      setInput("");
      setSuggestions([]);
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
    // We intentionally don't delete from stockData cache to save API calls if re-added
  };

  // --- RENDER HELPERS ---
  const StockReportCard = ({ summary }: { summary: StockSummary }) => {
    if (!summary) return null;
    const isPositive = (summary.change ?? 0) >= 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 m-3 w-72 flex flex-col border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-1">{summary.symbol}</h2>
        <p className="text-xs text-gray-500 mb-4 truncate">
          {summary.shortName}
        </p>

        <div className="mb-4">
          <span className="text-3xl font-bold">
            ${summary.price?.toFixed(2)}
          </span>
          <div
            className={`flex items-center mt-1 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <span className="font-bold mr-1">{isPositive ? "▲" : "▼"}</span>
            <span className="font-medium">
              {Math.abs(summary.change ?? 0).toFixed(2)} (
              {Math.abs(summary.changePercent ?? 0).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="mt-auto text-xs space-y-2 text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between">
            <span>Mkt Cap</span>
            <span className="font-medium">
              ${(summary.marketCap ? summary.marketCap / 1e9 : 0).toFixed(2)}B
            </span>
          </div>
          <div className="flex justify-between">
            <span>52W High</span>
            <span className="font-medium">
              ${summary.fiftyTwoWeekHigh?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const chartData = combineChartData(
    symbols,
    stockData,
    TIME_RANGES[timeRange]
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-black dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stock Price Analysis</h1>

        {/* SEARCH BAR */}
        <div className="relative w-full max-w-md mb-6 z-50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search symbol (e.g. MSFT)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSymbol()}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
              autoComplete="off"
            />
            <button
              onClick={() => handleAddSymbol()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {suggestions.map((sug) => (
                <div
                  key={sug}
                  onClick={() => handleAddSymbol(sug)}
                  className="cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700"
                >
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE TAGS */}
        <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
          {symbols.map((sym) => (
            <div
              key={sym}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              {sym}
              <button
                onClick={() => handleRemoveSymbol(sym)}
                className="text-gray-400 hover:text-red-500 ml-1 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* TIME RANGE SELECTOR */}
        <div className="flex gap-2 mb-4">
          {Object.keys(TIME_RANGES).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                timeRange === range
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* MAIN CHART */}
        <div className="w-full h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-8">
          {loading && !chartData.length ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Loading data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ fontSize: 12 }}
                  labelStyle={{
                    color: "#111",
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                {symbols.map((symbol, idx) => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    stroke={chartColors[idx % chartColors.length]}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* CARDS GRID */}
        <div className="flex flex-wrap justify-center gap-4">
          {symbols.map((sym) => (
            <StockReportCard key={sym} summary={stockSummaries[sym]} />
          ))}
        </div>
      </div>
    </div>
  );
}
