import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeatherProbability {
  condition: string;
  probability: number;
  threshold: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  historical_mean: number;
  trend_slope: number;
  p_value: number;
}

interface WeatherAnalysisChartsProps {
  probabilities: WeatherProbability[];
  selectedMetric: string;
}

// Generate historical trend data for the selected metric
const generateHistoricalData = (probability: WeatherProbability) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  // Generate 35 years of historical data (1990-2024)
  for (let year = 1990; year <= currentYear; year++) {
    const baseValue = probability.historical_mean;
    const trendEffect = probability.trend_slope * (year - 1990);
    const randomVariation = (Math.random() - 0.5) * 10; // ±5% random variation
    const value = Math.max(0, Math.min(100, baseValue + trendEffect + randomVariation));
    
    years.push({
      year,
      probability: Math.round(value * 10) / 10,
      trend: trendEffect
    });
  }
  
  return years;
};

// Generate calendar heatmap data (365 days)
const generateCalendarData = (probability: WeatherProbability) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const calendarData = [];
  
  months.forEach((month, monthIndex) => {
    const daysInMonth = new Date(2024, monthIndex + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Simulate seasonal patterns
      const seasonalFactor = Math.sin((monthIndex * 30 + day) * Math.PI / 180) * 0.3;
      const baseProb = probability.probability;
      const dailyProb = Math.max(0, Math.min(100, baseProb + seasonalFactor * 20 + (Math.random() - 0.5) * 15));
      
      calendarData.push({
        month,
        day,
        date: `${month} ${day}`,
        probability: Math.round(dailyProb * 10) / 10,
        risk: dailyProb > 60 ? 'high' : dailyProb > 30 ? 'medium' : 'low'
      });
    }
  });
  
  return calendarData;
};

// Generate histogram data showing distribution around threshold
const generateHistogramData = (probability: WeatherProbability) => {
  const data = [];
  const threshold = parseFloat(probability.threshold.replace(/[^\d.-]/g, ''));
  
  // Create bins around the threshold
  for (let i = -20; i <= 40; i += 5) {
    const binCenter = threshold + i;
    const binLabel = `${binCenter}${probability.threshold.includes('°C') ? '°C' : 
                     probability.threshold.includes('mm') ? 'mm' : 
                     probability.threshold.includes('m/s') ? 'm/s' : '%'}`;
    
    // Simulate normal distribution around historical mean
    const distance = Math.abs(binCenter - probability.historical_mean);
    const frequency = Math.max(0, 100 * Math.exp(-distance * distance / 200) + Math.random() * 10);
    
    data.push({
      bin: binLabel,
      frequency: Math.round(frequency * 10) / 10,
      isThreshold: Math.abs(binCenter - threshold) < 2.5,
      value: binCenter
    });
  }
  
  return data.filter(d => d.frequency > 1); // Remove very low frequency bins
};

export function WeatherAnalysisCharts({ probabilities, selectedMetric }: WeatherAnalysisChartsProps) {
  const selectedProbability = probabilities.find(p => 
    p.condition.toLowerCase().includes(selectedMetric.toLowerCase())
  ) || probabilities[0];

  const historicalData = generateHistoricalData(selectedProbability);
  const calendarData = generateCalendarData(selectedProbability);
  const histogramData = generateHistogramData(selectedProbability);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Historical Trend Chart */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            Historical Trend: {selectedProbability.condition}
            {getTrendIcon(selectedProbability.trend)}
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            35-year analysis (1990-2024) • Trend slope: {selectedProbability.trend_slope.toFixed(3)} • 
            P-value: {selectedProbability.p_value.toFixed(3)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="year" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Probability']}
                />
                <Line 
                  type="monotone" 
                  dataKey="probability" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                />
                {/* Trend line */}
                <Line 
                  type="linear" 
                  dataKey="trend" 
                  stroke="#ef4444" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Annual Risk Calendar (responsive) */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Annual Risk Calendar</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Daily probability throughout the year • Green: Low risk • Yellow: Medium risk • Red: High risk
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-[400px] sm:min-w-0">
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-1 text-[11px] sm:text-xs">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                  <div key={month} className="text-center font-medium text-muted-foreground mb-1 sm:mb-2">
                    {month}
                  </div>
                ))}
                {calendarData.slice(0, 365).map((day, index) => (
                  <div
                    key={index}
                    className="w-[6px] h-[6px] sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-[2px] cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: getRiskColor(day.risk) }}
                    title={`${day.date}: ${day.probability}% probability`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500"></div>
              <span>Low Risk (&lt;30%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500"></div>
              <span>Medium Risk (30-60%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
              <span>High Risk (&gt;60%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histogram with Threshold */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Distribution Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historical value distribution • Red line shows threshold: {selectedProbability.threshold}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="bin" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}`, 'Frequency']}
                />
                <Bar dataKey="frequency">
                  {histogramData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isThreshold ? '#ef4444' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
                <ReferenceLine 
                  x={selectedProbability.threshold} 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}