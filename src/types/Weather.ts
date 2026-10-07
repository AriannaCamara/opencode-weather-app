export type Unit = "celsius" | "fahrenheit";

export interface CurrentWeather {
  temperature: number;
  unit: string;
  time: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number | null;
  weatherCode: number | null;
}

export interface Forecast {
  unit: string;
  days: DailyForecast[];
}
