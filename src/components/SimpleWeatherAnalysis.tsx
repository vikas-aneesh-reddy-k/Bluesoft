import { Card } from '@/components/ui/card';

interface SimpleWeatherAnalysisProps {
  weatherType: string;
}

export function SimpleWeatherAnalysis({ weatherType }: SimpleWeatherAnalysisProps) {
  const getRecommendation = () => {
    switch (weatherType) {
      case 'rainy':
        return {
          canGoOut: false,
          message: "❌ STAY IN - Not safe to go out in heavy rain",
          bgColor: "bg-red-100",
          textColor: "text-red-800"
        };
      case 'stormy':
        return {
          canGoOut: false,
          message: "❌ STAY IN - Dangerous storm conditions",
          bgColor: "bg-red-100",
          textColor: "text-red-800"
        };
      case 'snowy':
        return {
          canGoOut: false,
          message: "⚠️ CAUTION - Cold and snowy conditions",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800"
        };
      case 'cloudy':
        return {
          canGoOut: true,
          message: "✅ GO OUT - Good weather for outdoor activities",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800"
        };
      case 'clear':
      default:
        return {
          canGoOut: true,
          message: "✅ GO OUT - Perfect weather for outdoor activities!",
          bgColor: "bg-green-100",
          textColor: "text-green-800"
        };
    }
  };

  const recommendation = getRecommendation();

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-md border border-primary/30 shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Weather Analysis</h3>
        <p className="text-sm text-muted-foreground">Current Weather: {weatherType}</p>
        <div className={`p-3 ${recommendation.bgColor} rounded-lg`}>
          <p className={`${recommendation.textColor} font-medium`}>{recommendation.message}</p>
        </div>
      </div>
    </Card>
  );
}
