export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  unit: string;
  windUnit: string;
  time: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number | null;
  minimum: number;
  maximum: number;
  precipitationProbability: number | null;
  windSpeedMax: number | null;
}

export interface Forecast {
  current: CurrentWeather;
  daily: DailyForecast[];
  temperatureUnit: string;
  windUnit: string;
  precipitationUnit: string;
}
