import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';

const app = express();
const port = 4000;

// Enable CORS for all routes and origins
app.use(cors());

// Route: Get historical stock data for chart
app.get('/api/stock', async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol query param' });

  try {
    const queryOptions = { period1: '2023-01-01', interval: '1d' };
    const result = await yahooFinance.historical(symbol, queryOptions);

    if (!result || result.length === 0) return res.status(404).json({ error: 'No data found' });

    const timeSeries = {};
    result.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0];
      timeSeries[dateStr] = {
        '4. close': item.close.toString(),
        '1. open': item.open.toString(),
        '2. high': item.high.toString(),
        '3. low': item.low.toString(),
        '5. volume': item.volume.toString(),
      };
    });

    res.json({
      'Meta Data': {
        '2. Symbol': symbol,
        '3. Last Refreshed': new Date().toISOString(),
      },
      'Time Series (Daily)': timeSeries,
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Route: Get summary info for stock
app.get('/api/stock/summary', async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol query param' });

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) return res.status(404).json({ error: 'No data found' });

    const summary = {
      symbol: quote.symbol,
      shortName: quote.shortName || quote.longName || '',
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      dividendYield: quote.dividendYield,
      peRatio: quote.trailingPE,
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
