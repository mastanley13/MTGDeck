import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IconCurrencyDollar, IconCalendar } from '@tabler/icons-react';

const PriceHistory = ({ deck }) => {
  const [timeRange, setTimeRange] = useState('1M'); // 1W, 1M, 3M, 6M, 1Y
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching price history data
    // In a real implementation, this would call your API
    const fetchPriceHistory = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock data for now
        const mockData = generateMockPriceData(timeRange);
        setPriceData(mockData);
      } catch (error) {
        console.error('Error fetching price history:', error);
      }
      setLoading(false);
    };

    fetchPriceHistory();
  }, [timeRange]);

  const generateMockPriceData = (range) => {
    const data = [];
    const now = new Date();
    const points = range === '1W' ? 7 : 
                  range === '1M' ? 30 :
                  range === '3M' ? 90 :
                  range === '6M' ? 180 : 365;

    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.random() * 100 + 200 // Random price between 200 and 300
      });
    }
    return data;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getPercentageChange = () => {
    if (priceData.length < 2) return 0;
    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    return ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary-400 flex items-center space-x-2">
            <IconCurrencyDollar size={20} />
            <span>Price History</span>
          </h3>
          <div className="flex space-x-2">
            {['1W', '1M', '3M', '6M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-slate-400 hover:text-primary-400 border border-transparent'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="text-sm text-slate-400">Current Value</div>
                <div className="text-2xl font-bold text-primary-400">
                  {formatPrice(priceData[priceData.length - 1]?.price || 0)}
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="text-sm text-slate-400">Change</div>
                <div className={`text-2xl font-bold ${
                  getPercentageChange() >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {getPercentageChange()}%
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="text-sm text-slate-400">Highest Value</div>
                <div className="text-2xl font-bold text-primary-400">
                  {formatPrice(Math.max(...priceData.map(d => d.price)))}
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid #475569',
                      borderRadius: '0.75rem',
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => formatPrice(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceHistory; 