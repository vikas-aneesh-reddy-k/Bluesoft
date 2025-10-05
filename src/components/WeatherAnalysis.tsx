import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Cloud, Sun, CloudRain, CloudSnow, Zap, Wind, Thermometer, Eye } from 'lucide-react';

interface WeatherAnalysisProps {
  weatherType: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  temperature?: number;
  windSpeed?: number;
  visibility?: number;
  precipitation?: number;
}

interface WeatherRecommendation {
  canGoOut: boolean;
  recommendation: string;
  icon: React.ReactNode;
  color: string;
  details: string[];
  precautions: string[];
}

export function WeatherAnalysis({ 
  weatherType, 
  temperature = 25, 
  windSpeed = 10, 
  visibility = 10, 
  precipitation = 0 
}: WeatherAnalysisProps) {
  
  // Debug: Log the weather type
  console.log('WeatherAnalysis - weatherType:', weatherType);
  
  const getWeatherRecommendation = (): WeatherRecommendation => {
    switch (weatherType) {
      case 'clear':
        return {
          canGoOut: true,
          recommendation: "Perfect weather for outdoor activities!",
          icon: <Sun className="w-6 h-6 text-yellow-500" />,
          color: "bg-green-500",
          details: [
            "Clear skies and good visibility",
            "Ideal for walking, cycling, or outdoor events",
            "Great for photography and sightseeing"
          ],
          precautions: [
            "Apply sunscreen if spending extended time outside",
            "Stay hydrated in warm weather",
            "Wear appropriate clothing for the temperature"
          ]
        };

      case 'cloudy':
        return {
          canGoOut: true,
          recommendation: "Good weather for outdoor activities",
          icon: <Cloud className="w-6 h-6 text-gray-500" />,
          color: "bg-blue-500",
          details: [
            "Overcast skies but no precipitation",
            "Comfortable for most outdoor activities",
            "Good lighting for photography"
          ],
          precautions: [
            "Bring a light jacket in case of temperature drop",
            "Monitor weather for potential rain",
            "Check if activities require clear skies"
          ]
        };

      case 'rainy':
        return {
          canGoOut: false,
          recommendation: "Not recommended for outdoor activities",
          icon: <CloudRain className="w-6 h-6 text-blue-600" />,
          color: "bg-orange-500",
          details: [
            "Wet conditions and reduced visibility",
            "Slippery surfaces and potential flooding",
            "Uncomfortable for most outdoor activities"
          ],
          precautions: [
            "Stay indoors if possible",
            "If you must go out, wear waterproof clothing",
            "Avoid driving unless necessary",
            "Be cautious of slippery surfaces"
          ]
        };

      case 'stormy':
        return {
          canGoOut: false,
          recommendation: "Stay indoors - dangerous conditions",
          icon: <Zap className="w-6 h-6 text-purple-600" />,
          color: "bg-red-500",
          details: [
            "Severe weather with lightning risk",
            "Strong winds and heavy precipitation",
            "Dangerous for all outdoor activities"
          ],
          precautions: [
            "Stay indoors and away from windows",
            "Avoid using electrical appliances",
            "Postpone all outdoor activities",
            "Have emergency supplies ready"
          ]
        };

      case 'snowy':
        return {
          canGoOut: temperature > -5,
          recommendation: temperature > -5 ? "Caution advised for outdoor activities" : "Stay indoors - too cold",
          icon: <CloudSnow className="w-6 h-6 text-blue-300" />,
          color: temperature > -5 ? "bg-yellow-500" : "bg-red-500",
          details: temperature > -5 ? [
            "Snowy conditions with cold temperatures",
            "Limited outdoor activities possible",
            "Good for winter sports if properly equipped"
          ] : [
            "Extremely cold temperatures",
            "Risk of frostbite and hypothermia",
            "Dangerous for outdoor activities"
          ],
          precautions: [
            "Dress in warm, layered clothing",
            "Wear non-slip footwear",
            "Limit time outdoors",
            "Watch for signs of cold stress"
          ]
        };

      default:
        return {
          canGoOut: true,
          recommendation: "Weather conditions are acceptable",
          icon: <Sun className="w-6 h-6 text-yellow-500" />,
          color: "bg-green-500",
          details: ["Standard weather conditions"],
          precautions: ["Check local weather updates"]
        };
    }
  };

  const recommendation = getWeatherRecommendation();

  // Simple fallback for debugging
  if (!weatherType) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur-md border border-primary/30 shadow-lg">
        <div className="text-center">
          <p className="text-red-500">Weather type not provided</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-md border border-primary/30 shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${recommendation.color} bg-opacity-20`}>
            {recommendation.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Weather Analysis</h3>
            <p className="text-sm text-muted-foreground">Outdoor Activity Recommendation</p>
            <p className="text-xs text-blue-500">Debug: {weatherType}</p>
          </div>
        </div>

        {/* Main Recommendation */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          {recommendation.canGoOut ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <XCircle className="w-6 h-6 text-red-500" />
          )}
          <div>
            <Badge 
              variant={recommendation.canGoOut ? "default" : "destructive"}
              className="mb-2"
            >
              {recommendation.canGoOut ? "GO OUT" : "STAY IN"}
            </Badge>
            <p className="text-sm font-medium">{recommendation.recommendation}</p>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <span>Temperature: {temperature}°C</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-blue-500" />
            <span>Wind: {windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-gray-500" />
            <span>Visibility: {visibility} km</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>Precipitation: {precipitation}mm</span>
          </div>
        </div>

        {/* Details */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-foreground">Conditions:</h4>
          <ul className="space-y-1">
            {recommendation.details.map((detail, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </div>

        {/* Precautions */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Precautions:
          </h4>
          <ul className="space-y-1">
            {recommendation.precautions.map((precaution, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                {precaution}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
