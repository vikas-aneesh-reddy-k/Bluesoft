import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, CloudRain, Sun, Wind, Thermometer, AlertTriangle, TrendingUp, Download, FileText, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeatherAnalysisCharts } from './WeatherAnalysisCharts';
import { DataSourceIndicator, APP_DATA_SOURCES } from './DataSourceIndicator';
import { CalendarHeatmap } from './CalendarHeatmap';
import { TrendAnalysis } from './TrendAnalysis';

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

interface AlternativeDate {
  date: string;
  comfort_index: number;
  offset_days: number;
  recommendation: 'Better' | 'Monitor' | 'Risky';
}

interface WeatherAnalysisResponse {
  location: { latitude: number; longitude: number };
  event_date: string;
  comfort_index: number;
  probabilities: WeatherProbability[];
  alternative_dates: AlternativeDate[];
  metadata: {
    datasets_used: string[];
    years_analyzed: string;
    analysis_date: string;
    confidence_level: string;
    data_window: string;
  };
}

interface WeatherData {
  temperature: { value: number; probability: number; trend: number };
  precipitation: { value: number; probability: number; trend: number };
  wind: { value: number; probability: number; trend: number };
  humidity: { value: number; probability: number; trend: number };
  comfortScore: number;
  alternativeDates: string[];
}

interface WeatherDashboardProps {
  location: { lat: number; lng: number; name?: string };
  date: Date;
  data?: WeatherData;
  analysisData?: WeatherAnalysisResponse;
}

export function WeatherDashboard({ location, date, data, analysisData }: WeatherDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'precipitation' | 'wind' | 'humidity'>('temperature');

  // Simulated data for demo
  const weatherData: WeatherData = data || {
    temperature: { value: 32, probability: 22, trend: 0.3 },
    precipitation: { value: 5, probability: 35, trend: 0.5 },
    wind: { value: 15, probability: 12, trend: -0.1 },
    humidity: { value: 70, probability: 45, trend: 0.2 },
    comfortScore: 72,
    alternativeDates: ['July 2', 'July 8', 'July 15'],
  };

  const metrics = [
    { 
      key: 'temperature' as const, 
      label: 'Temperature', 
      icon: Thermometer, 
      color: 'text-weather-hot',
      bgColor: 'bg-weather-hot/10',
      unit: '°C',
      threshold: '>32°C'
    },
    { 
      key: 'precipitation' as const, 
      label: 'Precipitation', 
      icon: CloudRain, 
      color: 'text-weather-rainy',
      bgColor: 'bg-weather-rainy/10',
      unit: 'mm',
      threshold: '>5mm'
    },
    { 
      key: 'wind' as const, 
      label: 'Wind Speed', 
      icon: Wind, 
      color: 'text-weather-windy',
      bgColor: 'bg-weather-windy/10',
      unit: 'm/s',
      threshold: '>15m/s'
    },
    { 
      key: 'humidity' as const, 
      label: 'Humidity', 
      icon: Sun, 
      color: 'text-weather-sunny',
      bgColor: 'bg-weather-sunny/10',
      unit: '%',
      threshold: '>70%'
    },
  ];

  const getWeatherVerdict = () => {
    const highestProb = Math.max(
      weatherData.temperature.probability,
      weatherData.precipitation.probability,
      weatherData.wind.probability,
      weatherData.humidity.probability
    );
    
    if (highestProb < 20) return { text: 'Excellent conditions', color: 'text-green-500' };
    if (highestProb < 40) return { text: 'Good conditions', color: 'text-weather-sunny' };
    if (highestProb < 60) return { text: 'Fair conditions', color: 'text-yellow-500' };
    return { text: 'Challenging conditions', color: 'text-weather-hot' };
  };

  const verdict = getWeatherVerdict();
  const activeMetricData = weatherData[activeMetric];

  const handleExportCSV = () => {
    const metadata = analysisData?.metadata || {
      datasets_used: ['MERRA-2', 'GPM IMERG'],
      years_analyzed: '1990-2024',
      analysis_date: new Date().toISOString(),
      confidence_level: '85%',
      data_window: '±7 days'
    };

    const probabilities = analysisData?.probabilities || [
      { condition: 'Very Hot', probability: weatherData.temperature.probability, threshold: '>32°C', trend: 'increasing' as const, confidence: 0.85, historical_mean: 28.3, trend_slope: 0.025, p_value: 0.04 },
      { condition: 'Heavy Rain', probability: weatherData.precipitation.probability, threshold: '>5mm', trend: 'stable' as const, confidence: 0.72, historical_mean: 3.2, trend_slope: 0.005, p_value: 0.25 },
      { condition: 'Strong Wind', probability: weatherData.wind.probability, threshold: '>15m/s', trend: 'stable' as const, confidence: 0.65, historical_mean: 8.5, trend_slope: -0.001, p_value: 0.30 },
      { condition: 'High Humidity', probability: weatherData.humidity.probability, threshold: '>70%', trend: 'increasing' as const, confidence: 0.78, historical_mean: 65.2, trend_slope: 0.02, p_value: 0.06 }
    ];

    // Create CSV matching PRD format exactly
    const locationName = location.name || 'Selected Location';
    const eventDate = date.toISOString().split('T')[0];
    
    let csv = `Location,Latitude,Longitude,Date,WindowDays,Variable,Threshold,Probability,Units,YearsUsed,Dataset,TrendSlope,TrendPValue,Confidence,HistoricalMean,Recommendation\n`;

    probabilities.forEach(prob => {
      const dataset = prob.condition.includes('Rain') || prob.condition.includes('Precipitation') ? 'GPM IMERG' : 'MERRA-2';
      const units = prob.threshold.includes('°C') ? 'degC' : 
                   prob.threshold.includes('mm') ? 'mm/day' : 
                   prob.threshold.includes('m/s') ? 'm/s' : 'percent';
      const recommendation = prob.probability < 20 ? 'Low Risk' : prob.probability < 40 ? 'Moderate Risk' : 'High Risk';
      
      csv += `${locationName},${location.lat},${location.lng},${eventDate},7,${prob.condition},${prob.threshold},${prob.probability},${units},${metadata.years_analyzed},${dataset},${prob.trend_slope.toFixed(6)},${prob.p_value.toFixed(3)},${prob.confidence.toFixed(2)},${prob.historical_mean.toFixed(1)},${recommendation}\n`;
    });

    // Add alternative dates if available
    if (analysisData?.alternative_dates) {
      csv += `\n# Alternative Dates with Better Conditions\nAlternativeDate,ComfortIndex,OffsetDays,Recommendation\n`;
      analysisData.alternative_dates.forEach(alt => {
        csv += `${alt.date},${alt.comfort_index},${alt.offset_days},${alt.recommendation}\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_risk_${locationName.replace(/[^a-zA-Z0-9]/g, '_')}_${eventDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const exportData = {
      analysis: {
        location: {
          name: location.name || 'Selected Location',
          latitude: location.lat,
          longitude: location.lng
        },
        event_date: date.toISOString().split('T')[0],
        comfort_index: analysisData?.comfort_index || weatherData.comfortScore,
        probabilities: analysisData?.probabilities || [],
        alternative_dates: analysisData?.alternative_dates || [],
        metadata: analysisData?.metadata || {
          datasets_used: ['MERRA-2', 'GPM IMERG'],
          years_analyzed: '1990-2024',
          analysis_date: new Date().toISOString(),
          confidence_level: '85%',
          data_window: '±7 days'
        }
      },
      data_sources: {
        'MERRA-2': {
          full_name: 'Modern-Era Retrospective analysis for Research and Applications, Version 2',
          provider: 'NASA Global Modeling and Assimilation Office (GMAO)',
          variables: ['Temperature', 'Wind Speed', 'Air Quality'],
          resolution: '0.5° × 0.625°',
          temporal_coverage: '1980-present'
        },
        'GPM IMERG': {
          full_name: 'Global Precipitation Measurement Integrated Multi-satellitE Retrievals',
          provider: 'NASA Goddard Space Flight Center',
          variables: ['Precipitation'],
          resolution: '0.1° × 0.1°',
          temporal_coverage: '1997-present'
        }
      },
      citation: 'Data provided by NASA Goddard Earth Sciences Data and Information Services Center (GES DISC). Analysis performed using Will It Rain On My Parade? - NASA Space Apps Challenge 2025.'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_analysis_${location.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'location'}_${date.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a temporary container for the report
      const reportContainer = document.createElement('div');
      reportContainer.style.position = 'absolute';
      reportContainer.style.left = '-9999px';
      reportContainer.style.top = '0';
      reportContainer.style.width = '800px';
      reportContainer.style.backgroundColor = 'white';
      reportContainer.style.padding = '20px';
      reportContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Generate report HTML
      const metadata = analysisData?.metadata || {
        datasets_used: ['MERRA-2', 'GPM IMERG'],
        years_analyzed: '1990-2024',
        analysis_date: new Date().toISOString(),
        confidence_level: '85%',
        data_window: '±7 days'
      };
      
      const probabilities = analysisData?.probabilities || [];
      
      reportContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; font-size: 24px; margin-bottom: 10px;">🌦️ Weather Risk Analysis Report</h1>
          <p style="color: #666; font-size: 14px;">Will It Rain On My Parade? - NASA Space Apps Challenge 2025</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px;">📍 Event Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Location:</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${location.name || 'Selected Location'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Coordinates:</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Event Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${date.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Comfort Index:</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 18px; font-weight: bold; color: #1e40af;">${analysisData?.comfort_index || weatherData.comfortScore}%</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px;">📊 Weather Risk Probabilities</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Condition</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">Probability</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">Threshold</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">Trend</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${probabilities.map(prob => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${prob.condition}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: ${prob.probability > 50 ? '#dc2626' : prob.probability > 25 ? '#d97706' : '#16a34a'};">${prob.probability}%</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${prob.threshold}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${prob.trend}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${(prob.confidence * 100).toFixed(0)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px;">📈 Data Sources & Methodology</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin-bottom: 10px;"><strong>NASA Datasets Used:</strong></p>
            <ul style="margin-left: 20px; margin-bottom: 15px;">
              <li><strong>MERRA-2:</strong> Modern-Era Retrospective analysis for Research and Applications, Version 2</li>
              <li><strong>GPM IMERG:</strong> Global Precipitation Measurement Integrated Multi-satellitE Retrievals</li>
            </ul>
            <p style="margin-bottom: 5px;"><strong>Analysis Period:</strong> ${metadata.years_analyzed}</p>
            <p style="margin-bottom: 5px;"><strong>Confidence Level:</strong> ${metadata.confidence_level}</p>
            <p style="margin-bottom: 5px;"><strong>Data Window:</strong> ${metadata.data_window}</p>
            <p style="margin-bottom: 0px;"><strong>Generated:</strong> ${new Date(metadata.analysis_date).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #666; font-size: 12px;">
            Generated by Will It Rain On My Parade? - NASA Space Apps Challenge 2025<br>
            Data provided by NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)
          </p>
        </div>
      `;
      
      document.body.appendChild(reportContainer);
      
      // Convert to canvas and then to PDF
      const canvas = await html2canvas(reportContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up
      document.body.removeChild(reportContainer);
      
      // Download PDF
      const fileName = `weather_risk_report_${location.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'location'}_${date.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback: show alert
      alert('PDF generation failed. Please try again or use CSV/JSON export instead.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Source Verification */}
      <DataSourceIndicator dataSources={APP_DATA_SOURCES} />
      
      {/* Main Verdict Card */}
      <Card className="bg-gradient-space border-primary/20 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Weather Forecast Analysis
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                {location.name || `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`} • {date.toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportCSV} variant="glass" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportJSON} variant="outline" size="sm" className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={handleExportPDF} variant="default" size="sm" className="w-full sm:w-auto">
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn("h-6 w-6 sm:h-8 sm:w-8", verdict.color)} />
              <div>
                <p className={cn("text-lg sm:text-2xl font-semibold", verdict.color)}>{verdict.text}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Based on historical data analysis</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-muted-foreground">Comfort Score</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{weatherData.comfortScore}%</p>
            </div>
          </div>

          {/* Comfort Score Gauge */}
          <div className="relative h-3 sm:h-4 bg-card/50 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-aurora transition-all duration-1000"
              style={{ width: `${weatherData.comfortScore}%` }}
            />
            <div className="absolute inset-0 bg-gradient-radial from-transparent to-transparent"></div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((metric) => {
          const metricData = weatherData[metric.key];
          return (
            <Card
              key={metric.key}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-glow",
                activeMetric === metric.key ? "ring-2 ring-primary shadow-glow" : "border-primary/20"
              )}
              onClick={() => setActiveMetric(metric.key)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                    <metric.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", metric.color)} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{metric.threshold}</p>
                    <p className="text-base sm:text-lg font-semibold">{metricData.probability}%</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium mb-1">{metric.label}</p>
                <Progress value={metricData.probability} className="h-[3px] sm:h-1" />
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className={cn(
                    "h-3 w-3",
                    metricData.trend > 0 ? "text-weather-hot" : "text-weather-cold"
                  )} />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {metricData.trend > 0 ? '+' : ''}{(metricData.trend * 100).toFixed(1)}% trend
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Detailed Analysis: {metrics.find(m => m.key === activeMetric)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Probability</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{activeMetricData.probability}%</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Expected Value</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {activeMetricData.value}
                  {metrics.find(m => m.key === activeMetric)?.unit}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">10-Year Trend</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {activeMetricData.trend > 0 ? '+' : ''}{(activeMetricData.trend * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Historical Charts */}
            {analysisData?.probabilities && (
              <WeatherAnalysisCharts 
                probabilities={analysisData.probabilities}
                selectedMetric={activeMetric}
              />
            )}

            {/* Calendar Heatmap */}
            {analysisData?.probabilities && (
              <CalendarHeatmap 
                probabilities={analysisData.probabilities}
                selectedMetric={activeMetric}
                year={date.getFullYear()}
              />
            )}

            {/* Trend Analysis */}
            {analysisData?.probabilities && (
              <TrendAnalysis 
                probabilities={analysisData.probabilities}
                selectedMetric={activeMetric}
              />
            )}

            {/* Alternative Dates */}
            <div>
              <p className="text-sm font-medium mb-2">Alternative Dates with Better Conditions:</p>
              <div className="flex gap-2 flex-wrap">
                {(analysisData?.alternative_dates || weatherData.alternativeDates.map(date => ({ 
                  date, 
                  comfort_index: Math.floor(Math.random() * 30) + 70, 
                  offset_days: 0, 
                  recommendation: 'Better' as const 
                }))).map((altDate, index) => (
                  <Button key={index} variant="outline" size="sm" className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{typeof altDate === 'string' ? altDate : new Date(altDate.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {typeof altDate !== 'string' && (
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        altDate.recommendation === 'Better' ? 'bg-green-500/20 text-green-400' :
                        altDate.recommendation === 'Monitor' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {altDate.comfort_index}%
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}