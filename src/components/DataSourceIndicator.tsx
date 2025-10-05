import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Database, Satellite, Globe, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSource {
  name: string;
  status: 'real' | 'simulated' | 'hybrid';
  description: string;
  provider?: string;
  api_endpoint?: string;
  last_updated?: string;
}

interface DataSourceIndicatorProps {
  dataSources: DataSource[];
  className?: string;
}

export function DataSourceIndicator({ dataSources, className }: DataSourceIndicatorProps) {
  const realDataCount = dataSources.filter(ds => ds.status === 'real').length;
  const totalSources = dataSources.length;

  return (
    <Card className={cn("border-primary/20 bg-card/80 backdrop-blur", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Data Sources</span>
          </CardTitle>
          <Badge 
            className={cn(
              realDataCount === totalSources 
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : realDataCount > 0
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            )}
          >
            {realDataCount}/{totalSources} Real
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Overall Status Alert */}
        <Alert className={cn(
          realDataCount === totalSources 
            ? 'border-green-500/30 bg-green-500/5'
            : realDataCount > 0
            ? 'border-orange-500/30 bg-orange-500/5'
            : 'border-yellow-500/30 bg-yellow-500/5'
        )}>
          {realDataCount === totalSources ? (
            <Satellite className="h-4 w-4" />
          ) : realDataCount > 0 ? (
            <Globe className="h-4 w-4" />
          ) : (
            <Beaker className="h-4 w-4" />
          )}
          <AlertDescription>
            {realDataCount === totalSources ? (
              <strong>All data sources are providing real-time information</strong>
            ) : realDataCount > 0 ? (
              <>
                <strong>Mixed data sources:</strong> Some real-time, some simulated for demonstration
              </>
            ) : (
              <>
                <strong>Demo mode:</strong> All data is simulated based on realistic climatological patterns
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Individual Data Sources */}
        <div className="space-y-2 sm:space-y-3">
          {dataSources.map((source, index) => (
            <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="flex-shrink-0 mt-0.5">
                {source.status === 'real' ? (
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                ) : (
                  <Beaker className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{source.name}</p>
                  <Badge className={cn(
                    'text-[10px] sm:text-xs',
                    source.status === 'real' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  )}>
                    {source.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2">
                  {source.description}
                </p>
                {source.provider && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    <strong>Provider:</strong> {source.provider}
                  </p>
                )}
                {source.api_endpoint && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-mono break-all">
                    <strong>API:</strong> {source.api_endpoint}
                  </p>
                )}
                {source.last_updated && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    <strong>Updated:</strong> {new Date(source.last_updated).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* How to Get Real NASA Data */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">🚀 To enable real NASA data:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Register at <code className="bg-muted px-1 rounded">earthdata.nasa.gov</code></li>
            <li>• Get API credentials for MERRA-2 and GPM IMERG</li>
            <li>• Configure backend with NASA Earthdata authentication</li>
            <li>• Replace simulation functions with OPeNDAP API calls</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Default data sources for the app
export const APP_DATA_SOURCES: DataSource[] = [
  {
    name: 'Current Weather',
    status: 'real',
    description: 'Real-time weather conditions from meteorological stations',
    provider: 'Open-Meteo (ECMWF)',
    api_endpoint: 'api.open-meteo.com/v1/forecast',
    last_updated: new Date().toISOString()
  },
  {
    name: 'Historical Temperature Analysis',
    status: 'real',
    description: 'Daily temperature from NASA POWER (T2M)',
    provider: 'NASA POWER',
    api_endpoint: 'power.larc.nasa.gov/api/temporal/daily/point'
  },
  {
    name: 'Precipitation Probabilities',
    status: 'real',
    description: 'Daily precipitation from NASA POWER (PRECTOTCORR)',
    provider: 'NASA POWER',
    api_endpoint: 'power.larc.nasa.gov/api/temporal/daily/point'
  },
  {
    name: 'Wind Speed Analysis',
    status: 'real',
    description: 'Daily 10m wind speed from NASA POWER (WS10M)',
    provider: 'NASA POWER',
    api_endpoint: 'power.larc.nasa.gov/api/temporal/daily/point'
  }
];