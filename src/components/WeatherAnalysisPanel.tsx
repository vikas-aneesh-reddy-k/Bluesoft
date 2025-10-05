import { Button } from '@/components/ui/button';

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

interface WeatherAnalysisPanelProps {
  weatherProbabilities: WeatherProbability[];
  comfortIndex: number;
  onExportData: (format: 'csv' | 'json') => void;
  isVisible: boolean;
  eventDate?: string;
}

const calculateComfortIndex = (probabilities: WeatherProbability[]): number => {
  if (!probabilities || probabilities.length === 0) return 0;
  
  // Calculate comfort based on probability of adverse conditions
  const totalRisk = probabilities.reduce((sum, prob) => {
    // Higher probability of adverse conditions reduces comfort
    const riskFactor = prob.probability / 100;
    return sum + riskFactor;
  }, 0);
  
  // Convert to comfort percentage (inverse of risk)
  const maxRisk = probabilities.length; // Maximum possible risk
  const comfortPercentage = Math.max(0, Math.min(100, 100 - (totalRisk / maxRisk) * 100));
  
  return Math.round(comfortPercentage);
};

export function WeatherAnalysisPanel({ 
  weatherProbabilities, 
  comfortIndex, 
  onExportData, 
  isVisible,
  eventDate 
}: WeatherAnalysisPanelProps) {
  if (!isVisible || !weatherProbabilities || weatherProbabilities.length === 0) {
    return null;
  }

  const calculatedComfortIndex = calculateComfortIndex(weatherProbabilities);
  const isToday = eventDate === new Date().toISOString().split('T')[0];

  return (
    <div className="bg-card/95 backdrop-blur-md border border-primary/30 rounded-lg p-4 shadow-lg">
      <div className="text-lg font-semibold mb-1 text-center">
        🌦️ Analysis
      </div>
      {isToday && (
        <div className="text-center mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            🔴 Live • Today's Data
          </span>
        </div>
      )}
      
      {/* Comfort Index */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Comfort</span>
          <span className="text-lg font-bold">
            {calculatedComfortIndex}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              calculatedComfortIndex >= 70 ? 'bg-green-500' :
              calculatedComfortIndex >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${calculatedComfortIndex}%` }}
          />
        </div>
      </div>

      {/* Weather Probabilities - Enhanced for wider layout */}
      <div className="space-y-3 mb-4">
        {weatherProbabilities.map((prob, index) => (
          <div key={index} className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  prob.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                  prob.trend === 'decreasing' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {prob.trend === 'increasing' ? '↗️' : prob.trend === 'decreasing' ? '↘️' : '→'}
                </span>
                <div>
                  <div className="text-base font-semibold capitalize">{prob.condition}</div>
                  <div className="text-sm text-muted-foreground">{prob.threshold}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{prob.probability}%</div>
                <div className="text-sm text-muted-foreground">±{Math.round((1-prob.confidence)*100)}%</div>
              </div>
            </div>
            
            {/* Progress bar for visual representation */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  prob.probability >= 70 ? 'bg-red-500' :
                  prob.probability >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${prob.probability}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 mb-3">
        <Button
          onClick={() => onExportData('csv')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          📊 Export CSV
        </Button>
        <Button
          onClick={() => onExportData('json')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          📄 Export JSON
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Based on NASA MERRA-2 & GPM IMERG data (1990-2024)
      </div>
    </div>
  );
}