export const UK_CITIES = [
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Manchester", lat: 53.4808, lon: -2.2426 },
  { name: "Birmingham", lat: 52.4862, lon: -1.8904 },
  { name: "Leeds", lat: 53.8008, lon: -1.5491 },
  { name: "Glasgow", lat: 55.8642, lon: -4.2518 },
  { name: "Edinburgh", lat: 55.9533, lon: -3.1883 },
  { name: "Bristol", lat: 51.4545, lon: -2.5879 },
  { name: "Liverpool", lat: 53.4084, lon: -2.9916 },
  { name: "Sheffield", lat: 53.3811, lon: -1.4701 },
  { name: "Cardiff", lat: 51.4816, lon: -3.1791 },
];

export type WeatherCondition = "sunny_warm" | "sunny_cool" | "cloudy" | "rainy";

export const CONDITION_CONFIG: Record<
  WeatherCondition,
  { label: string; emoji: string; adjustment: number; color: string }
> = {
  sunny_warm: {
    label: "Sunny & Warm",
    emoji: "☀️",
    adjustment: 0.3,
    color: "#f59e0b",
  },
  sunny_cool: {
    label: "Sunny & Cool",
    emoji: "🌤️",
    adjustment: 0.2,
    color: "#fbbf24",
  },
  cloudy: {
    label: "Cloudy",
    emoji: "☁️",
    adjustment: 0.0,
    color: "#94a3b8",
  },
  rainy: {
    label: "Rainy",
    emoji: "🌧️",
    adjustment: -0.2,
    color: "#60a5fa",
  },
};

export const WARM_THRESHOLD_C = 18;
export const BASE_WEEKLY_SALES = 500_000;
export const BASE_DAILY_SALES = BASE_WEEKLY_SALES / 7;

// WMO weather interpretation codes:
// 0: Clear sky
// 1: Mainly clear, 2: Partly cloudy, 3: Overcast
// 45, 48: Fog
// 51-57: Drizzle; 61-67: Rain; 71-77: Snow
// 80-82: Rain showers; 85-86: Snow showers; 95-99: Thunderstorm
export function classifyWeather(
  weatherCode: number,
  maxTemp: number
): WeatherCondition {
  if (weatherCode >= 51) return "rainy";
  if (weatherCode >= 3) return "cloudy";
  if (maxTemp >= WARM_THRESHOLD_C) return "sunny_warm";
  return "sunny_cool";
}

export interface DayForecast {
  date: string;
  dayName: string;
  condition: WeatherCondition;
  maxTemp: number;
  weatherCode: number;
  adjustment: number;
  baseSales: number;
  forecastSales: number;
}

export interface WeatherForecastData {
  city: string;
  days: DayForecast[];
  weeklyTotal: number;
  weeklyBaseline: number;
  adjustmentPct: number;
}

export async function fetchWeatherForecast(
  cityName: string,
  baseWeeklySales: number = BASE_WEEKLY_SALES
): Promise<WeatherForecastData> {
  const city = UK_CITIES.find((c) => c.name === cityName);
  if (!city) throw new Error(`Unknown city: ${cityName}`);

  const baseDailySales = baseWeeklySales / 7;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", city.lat.toString());
  url.searchParams.set("longitude", city.lon.toString());
  url.searchParams.set(
    "daily",
    "weathercode,temperature_2m_max,temperature_2m_min"
  );
  url.searchParams.set("timezone", "Europe/London");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error("Failed to fetch weather data from Open-Meteo");

  const data = await res.json();

  const days: DayForecast[] = data.daily.time.map(
    (date: string, i: number) => {
      const weatherCode: number = data.daily.weathercode[i];
      const maxTemp: number = data.daily.temperature_2m_max[i];
      const condition = classifyWeather(weatherCode, maxTemp);
      const adjustment = CONDITION_CONFIG[condition].adjustment;
      const forecastSales = baseDailySales * (1 + adjustment);

      const dayDate = new Date(date + "T12:00:00Z");
      const dayName = dayDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Europe/London",
      });

      return {
        date,
        dayName,
        condition,
        maxTemp,
        weatherCode,
        adjustment,
        baseSales: baseDailySales,
        forecastSales,
      };
    }
  );

  const weeklyTotal = days.reduce((sum, d) => sum + d.forecastSales, 0);
  const adjustmentPct = (weeklyTotal - baseWeeklySales) / baseWeeklySales;

  return {
    city: cityName,
    days,
    weeklyTotal,
    weeklyBaseline: baseWeeklySales,
    adjustmentPct,
  };
}
