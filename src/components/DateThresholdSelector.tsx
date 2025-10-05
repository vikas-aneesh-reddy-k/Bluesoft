import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Thermometer, CloudRain, Wind, Droplets, Wind as AirIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Thresholds {
  temperature: { enabled: boolean; value: number };
  precipitation: { enabled: boolean; value: number };
  wind: { enabled: boolean; value: number };
  humidity: { enabled: boolean; value: number };
  air_quality: { enabled: boolean; value: number };
}

interface DateThresholdSelectorProps {
  onDateChange: (date: Date) => void;
  onThresholdsChange: (thresholds: Thresholds) => void;
  selectedDate: Date;
}

export function DateThresholdSelector({
  onDateChange,
  onThresholdsChange,
  selectedDate,
}: DateThresholdSelectorProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [thresholds, setThresholds] = useState<Thresholds>({
    temperature: { enabled: true, value: 32 },
    precipitation: { enabled: true, value: 5 },
    wind: { enabled: false, value: 15 },
    humidity: { enabled: false, value: 70 },
    air_quality: { enabled: false, value: 25 },
  });

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onDateChange(newDate);
    }
  };

  const handleThresholdChange = (
    type: keyof Thresholds,
    field: 'enabled' | 'value',
    value: boolean | number
  ) => {
    const newThresholds = {
      ...thresholds,
      [type]: {
        ...thresholds[type],
        [field]: value,
      },
    };
    setThresholds(newThresholds);
    onThresholdsChange(newThresholds);
  };

  const thresholdConfigs = [
    {
      key: 'temperature' as const,
      label: 'Very Hot',
      icon: Thermometer,
      color: 'text-weather-hot',
      min: 20,
      max: 45,
      unit: '°C',
      description: 'Temperature threshold',
    },
    {
      key: 'precipitation' as const,
      label: 'Very Wet',
      icon: CloudRain,
      color: 'text-weather-rainy',
      min: 0,
      max: 50,
      unit: 'mm',
      description: 'Daily precipitation',
    },
    {
      key: 'wind' as const,
      label: 'Very Windy',
      icon: Wind,
      color: 'text-weather-windy',
      min: 0,
      max: 30,
      unit: 'm/s',
      description: 'Wind speed threshold',
    },
    {
      key: 'humidity' as const,
      label: 'Very Humid',
      icon: Droplets,
      color: 'text-weather-sunny',
      min: 0,
      max: 100,
      unit: '%',
      description: 'Humidity level',
    },
    {
      key: 'air_quality' as const,
      label: 'Poor Air Quality',
      icon: AirIcon,
      color: 'text-orange-500',
      min: 5,
      max: 100,
      unit: 'μg/m³',
      description: 'PM2.5 equivalent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Select Event Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDateSelect(new Date())}
                >
                  📅 Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Select the date for your outdoor event. We'll analyze historical weather patterns
              to predict the likelihood of adverse conditions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Settings */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Weather Thresholds</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Customize what weather conditions you want to avoid
          </p>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6">
          {thresholdConfigs.map((config) => {
            const threshold = thresholds[config.key];
            return (
              <div key={config.key} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={cn("p-2 rounded-lg bg-card", config.color)}>
                      <config.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor={config.key} className="text-sm sm:text-base">
                        {config.label}
                      </Label>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={config.key}
                    checked={threshold.enabled}
                    onCheckedChange={(checked) =>
                      handleThresholdChange(config.key, 'enabled', checked)
                    }
                  />
                </div>
                
                {threshold.enabled && (
                  <div className="ml-9 sm:ml-11 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Threshold: {threshold.value}{config.unit}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-primary">
                        &gt; {threshold.value}{config.unit}
                      </span>
                    </div>
                    <Slider
                      value={[threshold.value]}
                      onValueChange={([value]) =>
                        handleThresholdChange(config.key, 'value', value)
                      }
                      min={config.min}
                      max={config.max}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] sm:text-xs text-muted-foreground">
                      <span>{config.min}{config.unit}</span>
                      <span>{config.max}{config.unit}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}