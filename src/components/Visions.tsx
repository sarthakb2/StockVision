import React, { useState } from "react";
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
import { 
  Search, 
  TrendingUp, 
  Loader2, 
  AlertCircle, 
  Activity 
} from "lucide-react";

// --- Types ---
interface GraphData {
  dates: string[];
  actual: number[];
  predicted: number[];
}

interface PythonResponse {
  status: string;
  prediction_text: string;
  final_predicted_price: number;
  graph_data: GraphData;
  error?: string;
}

const Visions: React.FC = () => {
  // --- State ---
  const [stockName, setStockName] = useState<string>("");
  const [result, setResult] = useState<PythonResponse | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Logic ---
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

      if (!response.ok || data.error) {
        throw new Error(data.error || data.detail || "Failed to get prediction");
      }

      setResult(data);

      // Format data for Recharts
      if (data.graph_data) {
        const formattedData = data.graph_data.dates.map(
          (date: string, index: number) => ({
            date,
            Actual: data.graph_data.actual[index],
            Predicted: data.graph_data.predicted[index],
          })
        );
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 text-center border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Stock Price Prediction
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Powered by LSTM Neural Networks & VADER Sentiment Analysis
          </p>
        </div>

        <div className="p-8">
          {/* Input Form */}
          <form onSubmit={handlePrediction} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                placeholder="Enter Stock Symbol (e.g. AAPL, TSLA)"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Predict
                </>
              )}
            </button>
          </form>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12 animate-pulse">
              <div className="h-12 w-12 mx-auto mb-4 text-blue-600">
                <Loader2 className="h-full w-full animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Crunching numbers...</h3>
              <p className="text-gray-500">Downloading market data and training AI model.</p>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-6 rounded-r-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Analysis Result for {stockName.toUpperCase()}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {result.prediction_text}
                </p>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium text-lg">
                    Predicted Next Close: <span className="font-bold text-2xl ml-1">${result.final_predicted_price.toFixed(2)}</span>
                  </span>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actual vs AI Predicted Price</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">60 Day History + Forecast</span>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        minTickGap={30}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        width={60}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          color: "#111827"
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: "500" }}
                        labelStyle={{ color: "#6B7280", marginBottom: "4px" }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="Actual"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Actual Price"
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="Predicted"
                        stroke="#F97316"
                        strokeWidth={3}
                        dot={false}
                        strokeDasharray="5 5"
                        name="AI Prediction"
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visions;