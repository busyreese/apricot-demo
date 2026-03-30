import { WeatherCondition, CONDITION_CONFIG } from "@/lib/weather";

interface WeatherCardProps {
  condition: WeatherCondition;
  maxTemp: number;
  dayName: string;
  forecastSales: number;
}

export default function WeatherCard({
  condition,
  maxTemp,
  dayName,
  forecastSales,
}: WeatherCardProps) {
  const config = CONDITION_CONFIG[condition];
  const adj = config.adjustment;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        Today — {dayName}
      </p>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl leading-none">{config.emoji}</span>
        <div>
          <p className="text-base font-semibold text-gray-900">
            {config.label}
          </p>
          <p className="text-sm text-gray-400">{Math.round(maxTemp)}°C max</p>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 mb-1">Today&apos;s Forecast</p>
        <p className="text-2xl font-bold text-gray-900">
          £{Math.round(forecastSales).toLocaleString("en-GB")}
        </p>
        <span
          className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
            adj > 0
              ? "bg-green-100 text-green-700"
              : adj < 0
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {adj > 0 ? "+" : ""}
          {(adj * 100).toFixed(0)}% vs baseline
        </span>
      </div>
    </div>
  );
}
