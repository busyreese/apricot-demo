"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { DayForecast, CONDITION_CONFIG } from "@/lib/weather";

interface ForecastChartProps {
  days: DayForecast[];
}

const formatGBP = (value: number) => `£${(value / 1000).toFixed(0)}k`;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DayForecast }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const config = CONDITION_CONFIG[d.condition];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-900 mb-2">{d.dayName}</p>
      <p className="text-gray-500 mb-1">
        {config.emoji} {config.label}
      </p>
      <p className="text-gray-500 mb-3">{Math.round(d.maxTemp)}°C max</p>
      <p className="text-xl font-bold text-gray-900">
        £{Math.round(d.forecastSales).toLocaleString("en-GB")}
      </p>
      <p
        className={`text-xs mt-1 font-medium ${
          d.adjustment > 0
            ? "text-green-600"
            : d.adjustment < 0
            ? "text-red-500"
            : "text-gray-400"
        }`}
      >
        {d.adjustment > 0 ? "+" : ""}
        {(d.adjustment * 100).toFixed(0)}% vs baseline
      </p>
    </div>
  );
}

export default function ForecastChart({ days }: ForecastChartProps) {
  const dailyBaseline = days[0]?.baseSales ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-gray-900">
          7-Day Sales Forecast
        </h2>
        <span className="text-xs text-gray-400">
          Dashed line = £{(dailyBaseline / 1000).toFixed(1)}k daily baseline
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={days}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          barCategoryGap="35%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="dayName"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatGBP}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            domain={[
              (min: number) => Math.floor(min * 0.85 / 10000) * 10000,
              (max: number) => Math.ceil(max * 1.1 / 10000) * 10000,
            ]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <ReferenceLine
            y={dailyBaseline}
            stroke="#cbd5e1"
            strokeDasharray="6 3"
          />
          <Bar dataKey="forecastSales" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {days.map((day, index) => (
              <Cell
                key={index}
                fill={CONDITION_CONFIG[day.condition].color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 justify-center">
        {Object.entries(CONDITION_CONFIG).map(([key, config]) => (
          <div
            key={key}
            className="flex items-center gap-2 text-xs text-gray-500"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <span>
              {config.emoji} {config.label}{" "}
              <span
                className={
                  config.adjustment > 0
                    ? "text-green-600"
                    : config.adjustment < 0
                    ? "text-red-500"
                    : "text-gray-400"
                }
              >
                ({config.adjustment > 0 ? "+" : ""}
                {(config.adjustment * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
