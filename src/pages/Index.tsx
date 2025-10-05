import { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { Earth3DGlobe } from '@/components/Earth3DGlobe';
import { Map2D } from '@/components/Map2D';
import { DateThresholdSelector } from '@/components/DateThresholdSelector';
import { WeatherDashboard } from '@/components/WeatherDashboard';
import { WeatherEffects } from '@/components/WeatherEffects';
import { CurrentWeatherWidget } from '@/components/CurrentWeatherWidget';
import { WeatherAnalysisPanel } from '@/components/WeatherAnalysisPanel';
import { WeatherAnalysis } from '@/components/WeatherAnalysis';
import { SimpleWeatherAnalysis } from '@/components/SimpleWeatherAnalysis';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapIcon, Globe, ArrowLeft, Rocket, Cloud, Sun, CloudRain, CloudSnow, Zap, Loader2, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAutoWeather } from '@/hooks/useAutoWeather';

interface WeatherAnalysisResponse {
  location: { latitude: number; longitude: number };
  event_date: string;
  comfort_index: number;
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
  alternative_dates: Array<{
    date: string;
    comfort_index: number;
    offset_days: number;
    recommendation: 'Better' | 'Monitor' | 'Risky';
  }>;
  metadata: {
    datasets_used: string[];
    years_analyzed: string;
    analysis_date: string;
    confidence_level: string;
    data_window: string;
  };
}

const Index = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'hero' | 'app'>('hero');
  const [mapMode, setMapMode] = useState<'3d' | '2d'>('3d');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  
  // Use automatic weather detection
  const { weatherType, isLoading: weatherLoading, error: weatherError, lastUpdate } = useAutoWeather(selectedLocation);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Default to today
  const [thresholds, setThresholds] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<WeatherAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Local UI state for additional live overlay (wind/rain)
  const [overlayType, setOverlayType] = useState<'rain' | 'wind'>('rain');

  const handleLocationSelect = (lat: number, lng: number, name?: string) => {
    setSelectedLocation({ lat, lng, name });
  };

  const handleExportData = (format: 'csv' | 'json') => {
    if (!analysisData) return;

    const data = {
      location: analysisData.location,
      event_date: analysisData.event_date,
      comfort_index: analysisData.comfort_index,
      probabilities: analysisData.probabilities,
      alternative_dates: analysisData.alternative_dates,
      metadata: analysisData.metadata
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['Condition', 'Probability (%)', 'Threshold', 'Trend', 'Confidence'];
      const csvRows = analysisData.probabilities.map(prob => [
        prob.condition,
        prob.probability.toString(),
        prob.threshold,
        prob.trend,
        prob.confidence.toString()
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather-analysis-${analysisData.event_date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather-analysis-${analysisData.event_date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Export Complete",
      description: `Weather analysis data exported as ${format.toUpperCase()}.`,
    });
  };

  const handleAnalyze = async () => {
    if (!selectedLocation || !selectedDate || !thresholds) {
      toast({
        title: "Missing Information",
        description: "Please select a location, date, and set your thresholds.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Ensure we're using the most current date format
      const eventDate = selectedDate.toISOString().split('T')[0];
      const isToday = eventDate === new Date().toISOString().split('T')[0];
      
      const requestData = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        event_date: eventDate,
        thresholds: {
          hot_temp: thresholds.temperature?.enabled ? thresholds.temperature.value : 32.0,
          cold_temp: 0.0, // We don't have cold temp in the UI yet, using default
          precipitation: thresholds.precipitation?.enabled ? thresholds.precipitation.value : 5.0,
          wind_speed: thresholds.wind?.enabled ? thresholds.wind.value : 15.0,
          air_quality: thresholds.air_quality?.enabled ? thresholds.air_quality.value : 25.0
        },
        // Add flag to indicate if this is for today (for real-time data)
        is_current_date: isToday
      };

      console.log('Sending weather analysis request:', requestData);

      const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || '';
      const response = await fetch(`${BACKEND_URL || ''}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WeatherAnalysisResponse = await response.json();
      console.log('Received weather analysis:', data);
      
      setAnalysisData(data);
      setShowResults(true);
      
      toast({
        title: "Analysis Complete!",
        description: `Weather risk analysis completed for ${selectedLocation.name || 'your location'}.`,
      });
      
    } catch (error) {
      console.error('Failed to fetch weather analysis:', error);
      
      // Fallback to simulated analysis when backend is unavailable
      const fallbackAnalysis: WeatherAnalysisResponse = {
        location: { latitude: selectedLocation.lat, longitude: selectedLocation.lng },
        event_date: selectedDate.toISOString().split('T')[0],
        comfort_index: Math.round(60 + Math.random() * 30),
        probabilities: [
          {
            condition: 'Temperature',
            probability: Math.round(20 + Math.random() * 30),
            threshold: '>32°C',
            trend: 'stable',
            confidence: 0.7,
            historical_mean: 28,
            trend_slope: 0.1,
            p_value: 0.05
          },
          {
            condition: 'Precipitation',
            probability: Math.round(10 + Math.random() * 40),
            threshold: '>5mm',
            trend: 'stable',
            confidence: 0.6,
            historical_mean: 3,
            trend_slope: 0.2,
            p_value: 0.03
          },
          {
            condition: 'Wind Speed',
            probability: Math.round(5 + Math.random() * 25),
            threshold: '>15m/s',
            trend: 'stable',
            confidence: 0.8,
            historical_mean: 8,
            trend_slope: -0.1,
            p_value: 0.08
          }
        ],
        alternative_dates: [
          {
            date: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            comfort_index: Math.round(70 + Math.random() * 20),
            offset_days: 1,
            recommendation: 'Better'
          },
          {
            date: new Date(selectedDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            comfort_index: Math.round(65 + Math.random() * 25),
            offset_days: 2,
            recommendation: 'Monitor'
          }
        ],
        metadata: {
          datasets_used: ['Fallback simulation'],
          years_analyzed: '2020-2024',
          analysis_date: new Date().toISOString().split('T')[0],
          confidence_level: 'Medium',
          data_window: 'Fallback mode - Backend unavailable'
        }
      };
      
      setAnalysisData(fallbackAnalysis);
      setShowResults(true);
      
      toast({
        title: "Analysis Complete (Fallback Mode)",
        description: `Weather analysis completed using simulated data for ${selectedLocation.name || 'your location'}.`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (view === 'hero') {
    return <HeroSection onGetStarted={() => setView('app')} />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-space">
      <WeatherEffects type={weatherType} intensity={30} />
      
      {/* Enhanced Background Coverage */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-purple-900/95 -z-10"></div>
      <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/40 to-black/60 -z-10"></div>
      
      {/* Header */}
      <header className="relative z-30 border-b border-primary/20 bg-card/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView('hero')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {/* NASA & Bluesoft Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/NSAC@2025 Harohalli icon.svg" 
                alt="NASA Space Apps Challenge 2025 - Harohalli" 
                className="h-7 w-7 sm:h-10 sm:w-10 md:h-12 md:w-12"
              />
              <img 
                src="/Bluesoft icon.svg" 
                alt="Bluesoft Team" 
                className="h-7 w-7 sm:h-10 sm:w-10 md:h-12 md:w-12"
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-0">
              <Rocket className="h-6 w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-snug break-words">
                <span className="whitespace-nowrap">Weather</span> <span className="whitespace-nowrap">Parade</span> <span className="whitespace-nowrap">Predictor</span>
              </h1>
            </div>
          </div>
          
          {/* Map mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-card/50 rounded-lg self-start sm:self-auto">
            <Button
              variant={mapMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapMode('3d')}
            >
              <Globe className="h-4 w-4 mr-1" />
              3D Globe
            </Button>
            <Button
              variant={mapMode === '2d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapMode('2d')}
            >
              <MapIcon className="h-4 w-4 mr-1" />
              2D Map
            </Button>
          </div>
          
          {/* Auto Weather Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {weatherLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-xs sm:text-sm">Updating weather...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {weatherType === 'clear' && <Sun className="h-4 w-4 text-yellow-500" />}
                {weatherType === 'cloudy' && <Cloud className="h-4 w-4 text-gray-400" />}
                {weatherType === 'rainy' && <CloudRain className="h-4 w-4 text-blue-500" />}
                {weatherType === 'stormy' && <Zap className="h-4 w-4 text-purple-500" />}
                {weatherType === 'snowy' && <CloudSnow className="h-4 w-4 text-blue-200" />}
                <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                  {weatherType} {selectedLocation ? `at ${selectedLocation.name || 'location'}` : ''}
                </span>
                {lastUpdate && (
                  <span className="text-[11px] sm:text-xs text-muted-foreground">
                    ({format(lastUpdate, 'HH:mm')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-20 w-full min-h-screen">
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-900/10 via-transparent to-purple-900/10">
          <div className="max-w-7xl mx-auto px-4 py-8">
        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Panel - Bento Grid for Controls */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Current Weather - Top Left, Tall */}
                <div className="col-span-2 row-span-2">
                  {selectedLocation ? (
                    <CurrentWeatherWidget
                      latitude={selectedLocation.lat}
                      longitude={selectedLocation.lng}
                      locationName={selectedLocation.name}
                    />
                  ) : (
                    <Card className="border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl p-6 h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <div className="text-4xl mb-4">📍</div>
                        <h3 className="text-lg font-semibold mb-2">Select Location</h3>
                        <p className="text-sm">
                          Click on the map to select a location for weather analysis.
                        </p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Date Selector - Bottom Left */}
                <div className="col-span-1 row-span-1">
                  <Card className="border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl p-4 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">Event Date</h3>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left font-normal text-xs",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {selectedDate ? format(selectedDate, "MMM dd") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedDate(new Date())}
                          >
                            📅 Today
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </Card>
                </div>

                {/* Analyze Button - Bottom Right */}
                <div className="col-span-1 row-span-1">
                  <Card className="border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl p-4 h-full flex items-center justify-center">
                    {selectedLocation && thresholds ? (
                      <Button
                        onClick={handleAnalyze}
                        variant="hero"
                        size="sm"
                        className="w-full h-full"
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            <span className="text-xs">Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="mr-1 h-4 w-4" />
                            <span className="text-xs">Analyze Risk</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Rocket className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Select location & set thresholds</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Weather Thresholds - Bottom Full Width */}
                <div className="col-span-2 row-span-2">
                  <DateThresholdSelector
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onThresholdsChange={setThresholds}
                  />
                </div>
              </div>
            </div>

            {/* Center Panel - Map (responsive height) */}
            <div className="lg:col-span-6 order-last lg:order-none">
              <Card className="border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="h-[420px] sm:h-[520px] md:h-[620px] lg:h-[700px]">
                  {mapMode === '3d' ? (
                    <Earth3DGlobe
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={selectedLocation || undefined}
                      weatherType={weatherType}
                    />
                  ) : (
                    <Map2D
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={selectedLocation || undefined}
                      weatherType={weatherType}
                    />
                  )}
                </div>
              </Card>
              
              {selectedLocation && (
                <Card className="mt-4 p-4 border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg">
                  <p className="text-sm text-muted-foreground">Selected Location:</p>
                  <p className="font-semibold">
                    {selectedLocation.name || `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°`}
                  </p>
                </Card>
              )}

              {/* Live Weather Layers also visible on selection screen (responsive) */}
              {selectedLocation && (
                <Card className="mt-4 p-3 sm:p-4 border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Live Weather Layers</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOverlayType('rain')}
                        className={`h-7 px-2 sm:px-3 text-xs ${overlayType === 'rain' ? 'bg-primary/10' : ''}`}
                      >
                        Precipitation
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOverlayType('wind')}
                        className={`h-7 px-2 sm:px-3 text-xs ${overlayType === 'wind' ? 'bg-primary/10' : ''}`}
                      >
                        Wind
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-primary/20">
                    <iframe
                      title="Live Weather Layer"
                      src={`https://embed.windy.com/embed2.html?lat=${selectedLocation.lat.toFixed(4)}&lon=${selectedLocation.lng.toFixed(4)}&detailLat=${selectedLocation.lat.toFixed(4)}&detailLon=${selectedLocation.lng.toFixed(4)}&zoom=6&level=surface&overlay=${overlayType === 'wind' ? 'wind' : 'rain'}&menu=&message=&marker=true&type=map&location=coordinates&detail=true&metricWind=default&metricTemp=default`}
                      width="100%"
                      height="280"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allow="fullscreen; geolocation"
                    />
                  </div>
                </Card>
              )}
              
            </div>

            {/* Right Panel - Analysis Results (Keep as is) */}
            <div className="lg:col-span-3">
              {analysisData && analysisData.probabilities.length > 0 ? (
                <WeatherAnalysisPanel
                  weatherProbabilities={analysisData.probabilities}
                  comfortIndex={analysisData.comfort_index}
                  onExportData={handleExportData}
                  isVisible={true}
                  eventDate={analysisData.event_date}
                />
              ) : (
                <div className="space-y-4">
                  {/* Only show quick recommendation after a location is selected */}
                  {selectedLocation ? (
                    <SimpleWeatherAnalysis weatherType={weatherType} />
                  ) : (
                    <Card className="border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl p-6">
                      <div className="text-center text-muted-foreground">
                        <div className="text-4xl mb-4">📍</div>
                        <h3 className="text-lg font-semibold mb-2">Select Location to Begin</h3>
                        <p className="text-sm">Pick a location on the map, then choose your event date to view analysis.</p>
                      </div>
                    </Card>
                  )}
                  
                  {/* Placeholder for additional analysis */}
                  <Card className="border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl p-6">
                    <div className="text-center text-muted-foreground">
                      <div className="text-4xl mb-4">🌦️</div>
                      <h3 className="text-lg font-semibold mb-2">Detailed Weather Analysis</h3>
                      <p className="text-sm">
                        Select a location and date, then click "Analyze Weather Risk" to see detailed weather predictions and comfort analysis.
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowResults(false)}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Selection
            </Button>
            
            <WeatherDashboard
              location={selectedLocation!}
              date={selectedDate}
              analysisData={analysisData || undefined}
            />
            {/* Additional Weather Layers Map: Precipitation / Wind, without affecting 2D/3D switch */}
            {selectedLocation && (
              <Card className="mt-6 p-4 border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Live Weather Layers</p>
                  {/* Simple local toggle for overlay */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOverlayType('rain')}
                      className={`h-7 px-3 text-xs ${overlayType === 'rain' ? 'bg-primary/10' : ''}`}
                    >
                      Precipitation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOverlayType('wind')}
                      className={`h-7 px-3 text-xs ${overlayType === 'wind' ? 'bg-primary/10' : ''}`}
                    >
                      Wind
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border border-primary/20">
                  <iframe
                    title="Live Weather Layer"
                    src={`https://embed.windy.com/embed2.html?lat=${selectedLocation.lat.toFixed(4)}&lon=${selectedLocation.lng.toFixed(4)}&detailLat=${selectedLocation.lat.toFixed(4)}&detailLon=${selectedLocation.lng.toFixed(4)}&zoom=6&level=surface&overlay=${overlayType === 'wind' ? 'wind' : 'rain'}&menu=&message=&marker=true&type=map&location=coordinates&detail=true&metricWind=default&metricTemp=default`}
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="fullscreen; geolocation"
                  />
                </div>
              </Card>
            )}
            
            {/* Weather Analysis for Outdoor Activities */}
            <div className="mt-6">
            <WeatherAnalysis 
                weatherType={weatherType}
                temperature={25} // You can get this from weather API
                windSpeed={10}   // You can get this from weather API
                visibility={10}  // You can get this from weather API
                precipitation={weatherType === 'rainy' ? 5 : 0}
              />
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="relative z-30 border-t border-primary/20 bg-card/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs sm:text-sm text-muted-foreground">
          <div className="mb-1">
            Made with <span role="img" aria-label="love">❤️</span> by
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
            <span>Vikas Kakarla</span>
            <span>•</span>
            <span>Sujith Putta</span>
            <span>•</span>
            <span>Dhanya Potla</span>
            <span>•</span>
            <span>Charan Gonuguntla</span>
            <span>•</span>
            <span>Sameeksha Ambati</span>
            <span>•</span>
            <span>Vignatri M</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
