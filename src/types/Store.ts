import type { City } from "./City.ts";
import type { Unit } from "./Weather.ts";

export interface Store {
  defaultCity: City | null;
  cities: City[];
  unit: Unit;
}
