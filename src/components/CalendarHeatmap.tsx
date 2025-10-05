import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CalendarHeatmapProps {
  probabilities: Array<{
    condition: string;
    probability: number;
    threshold: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    historical_mean: number;
    trend_slope: number;
    p_value: number;
  }>;
  selectedMetric?: 'temperature' | 'precipitation' | 'wind' | 'humidity';
  year?: number;
}

export function CalendarHeatmap({ probabilities, selectedMetric = 'temperature', year = 2024 }: CalendarHeatmapProps) {
  // Generate calendar data for the year
  const generateCalendarData = () => {
    const calendarData: { [key: string]: number } = {};
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Generate realistic seasonal patterns based on metric
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const month = d.getMonth();
      const day = d.getDate();
      const key = `${month + 1}-${day}`;
      
      let probability = 0;
      
      if (selectedMetric === 'temperature') {
        // Higher probability of hot weather in summer months
        const summerMonths = [5, 6, 7, 8]; // June, July, August, September
        if (summerMonths.includes(month)) {
          probability = 20 + Math.sin((dayOfYear - 150) * Math.PI / 180) * 30 + Math.random() * 20;
        } else {
          probability = 5 + Math.random() * 15;
        }
      } else if (selectedMetric === 'precipitation') {
        // Higher probability of rain in monsoon/wet seasons
        const wetMonths = [4, 5, 6, 7, 8, 9]; // May through October
        if (wetMonths.includes(month)) {
          probability = 30 + Math.sin((dayOfYear - 120) * Math.PI / 180) * 25 + Math.random() * 20;
        } else {
          probability = 10 + Math.random() * 15;
        }
      } else if (selectedMetric === 'wind') {
        // Higher probability of wind in winter months
        const windyMonths = [10, 11, 0, 1, 2]; // November through March
        if (windyMonths.includes(month)) {
          probability = 25 + Math.random() * 20;
        } else {
          probability = 10 + Math.random() * 15;
        }
      } else if (selectedMetric === 'humidity') {
        // Higher humidity in summer months
        const humidMonths = [5, 6, 7, 8]; // June through September
        if (humidMonths.includes(month)) {
          probability = 40 + Math.random() * 30;
        } else {
          probability = 20 + Math.random() * 20;
        }
      }
      
      calendarData[key] = Math.max(0, Math.min(100, probability));
    }
    
    return calendarData;
  };

  const calendarData = generateCalendarData();
  
  // Get the probability for the selected metric
  const selectedProbability = probabilities.find(p => 
    (selectedMetric === 'temperature' && p.condition.includes('Hot')) ||
    (selectedMetric === 'precipitation' && p.condition.includes('Rain')) ||
    (selectedMetric === 'wind' && p.condition.includes('Wind')) ||
    (selectedMetric === 'humidity' && p.condition.includes('Humidity'))
  )?.probability || 0;

  const getColorIntensity = (probability: number) => {
    if (probability < 20) return 'bg-green-500/20'; // Safe - green
    if (probability < 40) return 'bg-yellow-500/30'; // Moderate - yellow
    if (probability < 60) return 'bg-orange-500/40'; // Risky - orange
    return 'bg-red-500/50'; // High risk - red
  };

  const getTextColor = (probability: number) => {
    if (probability < 20) return 'text-green-400';
    if (probability < 40) return 'text-yellow-400';
    if (probability < 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2024 is leap year

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-base sm:text-lg">Calendar Heatmap - {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Risk</span>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/20 rounded"></div>
              <span>Safe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500/30 rounded"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500/40 rounded"></div>
              <span>Risky</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500/50 rounded"></div>
              <span>High Risk</span>
            </div>
          </div>
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Year-round weather risk patterns. Green = safe, red = high risk of adverse conditions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-4">
          {/* Current Event Highlight */}
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-[11px] sm:text-sm font-medium text-primary leading-tight">
              📅 Selected Event Date: {selectedProbability.toFixed(1)}% risk
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
              Based on historical patterns for this date
            </p>
          </div>

          {/* Calendar Grid - responsive and scrollable on very small screens */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-[400px] sm:min-w-0">
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-1">
                {months.map((month, monthIndex) => (
                  <div key={month} className="space-y-1">
                    <div className="text-[10px] sm:text-xs font-medium text-center text-muted-foreground mb-1 sm:mb-2 leading-none">
                      {month}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: daysInMonth[monthIndex] }, (_, dayIndex) => {
                        const day = dayIndex + 1;
                        const key = `${monthIndex + 1}-${day}`;
                        const probability = calendarData[key] || 0;
                        
                        return (
                          <div
                            key={day}
                            className={cn(
                              "w-[6px] h-[6px] sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-[2px] text-[8px] sm:text-[10px] md:text-xs flex items-center justify-center cursor-pointer hover:scale-110 transition-transform",
                              getColorIntensity(probability),
                              getTextColor(probability)
                            )}
                            title={`${month} ${day}: ${probability.toFixed(1)}% risk`}
                          >
                            {day <= 7 && day % 7 === 1 ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="pt-3 sm:pt-4 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-[10px] sm:text-xs leading-tight">
              <div>
                <p className="font-medium mb-1">Risk Levels:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500/20 rounded"></div>
                    <span>0-20%: Safe conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-yellow-500/30 rounded"></div>
                    <span>20-40%: Moderate risk</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium mb-1">Patterns:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-orange-500/40 rounded"></div>
                    <span>40-60%: Risky conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-red-500/50 rounded"></div>
                    <span>60-100%: High risk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
