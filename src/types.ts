export type Unit = "celsius" | "fahrenheit";

export interface City {
  id: number;
  name: string;
  country: string;
  region: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  unit: string;
  time: string;
}

export interface Store {
  defaultCity: City | null;
  cities: City[];
  unit: Unit;
}