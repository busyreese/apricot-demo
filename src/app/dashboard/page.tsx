"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import WeatherCard from "@/components/WeatherCard";
import ForecastChart from "@/components/ForecastChart";
import ForecastTable from "@/components/ForecastTable";
import { UK_CITIES, WeatherForecastData, DayForecast, CONDITION_CONFIG } from "@/lib/weather";

interface SavedForecast {
  id: string;
  createdAt: string;
  location: string;
  weekStart: string;
  totalForecast: number;
  baseline: number;
  adjustmentPct: number;
  days: DayForecast[];
}

function KPICard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && (
        <span
          className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
            positive === true
              ? "bg-green-100 text-green-700"
              : positive === false
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [city, setCity] = useState("London");
  const [forecast, setForecast] = useState<WeatherForecastData | null>(null);
  const [savedForecasts, setSavedForecasts] = useState<SavedForecast[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const [baseline, setBaseline] = useState(500_000);
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineInput, setBaselineInput] = useState("");
  const [savingBaseline, setSavingBaseline] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoadingWeather(true);
    setWeatherError("");

    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch weather");
        return r.json();
      })
      .then((data) => setForecast(data))
      .catch(() => setWeatherError("Could not load weather data. Please try again."))
      .finally(() => setLoadingWeather(false));
  }, [city, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/forecasts")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setSavedForecasts(data))
      .catch(console.error);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => data.weeklyBaseline && setBaseline(data.weeklyBaseline))
      .catch(console.error);
  }, [status]);

  const saveBaseline = async () => {
    const val = Number(baselineInput.replace(/[^0-9.]/g, ""));
    if (!val || val <= 0) return;
    setSavingBaseline(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyBaseline: val }),
    });
    if (res.ok) {
      setBaseline(val);
      setEditingBaseline(false);
    }
    setSavingBaseline(false);
  };

  const saveForecast = async () => {
    if (!forecast) return;
    setSaving(true);
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forecast),
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedForecasts((prev) => [saved, ...prev]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteForecast = async (id: string) => {
    await fetch(`/api/forecasts/${id}`, { method: "DELETE" });
    setSavedForecasts((prev) => prev.filter((f) => f.id !== id));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🍑</span>
          <p className="mt-3 text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const today = forecast?.days[0];
  const diff = forecast ? forecast.adjustmentPct * 100 : 0;
  const bestDay = forecast
    ? [...forecast.days].sort((a, b) => b.forecastSales - a.forecastSales)[0]
    : null;
  const worstDay = forecast
    ? [...forecast.days].sort((a, b) => a.forecastSales - b.forecastSales)[0]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sales Forecast</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-400">
                7-day weather-driven projection · Base:
              </span>
              {editingBaseline ? (
                <span className="flex items-center gap-1">
                  <span className="text-sm text-gray-400">£</span>
                  <input
                    type="text"
                    value={baselineInput}
                    onChange={(e) => setBaselineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveBaseline();
                      if (e.key === "Escape") setEditingBaseline(false);
                    }}
                    autoFocus
                    className="w-32 px-2 py-0.5 text-sm border border-orange-400 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    onClick={saveBaseline}
                    disabled={savingBaseline}
                    className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                  >
                    {savingBaseline ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingBaseline(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => {
                    setBaselineInput(baseline.toString());
                    setEditingBaseline(true);
                  }}
                  className="text-sm text-gray-600 font-medium hover:text-orange-500 transition-colors underline decoration-dotted underline-offset-2"
                >
                  £{baseline.toLocaleString("en-GB")}/week
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-700"
            >
              {UK_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={saveForecast}
              disabled={saving || loadingWeather || !forecast}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                saveSuccess
                  ? "bg-green-500 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              } disabled:opacity-50`}
            >
              {saveSuccess ? "✓ Saved!" : saving ? "Saving…" : "Save Forecast"}
            </button>
          </div>
        </div>

        {weatherError && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
            {weatherError}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {today ? (
            <WeatherCard
              condition={today.condition}
              maxTemp={today.maxTemp}
              dayName={today.dayName}
              forecastSales={today.forecastSales}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-100 rounded w-32" />
            </div>
          )}

          <KPICard
            label="Weekly Total Forecast"
            value={
              forecast
                ? `£${Math.round(forecast.weeklyTotal).toLocaleString("en-GB")}`
                : "—"
            }
            sub={
              forecast
                ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}% vs £${(baseline / 1000).toFixed(0)}k baseline`
                : undefined
            }
            positive={diff > 0 ? true : diff < 0 ? false : null}
          />

          <KPICard
            label="Best Day"
            value={
              bestDay
                ? `£${Math.round(bestDay.forecastSales).toLocaleString("en-GB")}`
                : "—"
            }
            sub={bestDay ? `${CONDITION_CONFIG[bestDay.condition].emoji} ${bestDay.dayName}` : undefined}
            positive={null}
          />

          <KPICard
            label="Worst Day"
            value={
              worstDay
                ? `£${Math.round(worstDay.forecastSales).toLocaleString("en-GB")}`
                : "—"
            }
            sub={worstDay ? `${CONDITION_CONFIG[worstDay.condition].emoji} ${worstDay.dayName}` : undefined}
            positive={null}
          />
        </div>

        {/* Chart */}
        <div className="mb-6">
          {loadingWeather ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-300 text-sm animate-pulse">
                Fetching live weather data…
              </p>
            </div>
          ) : forecast ? (
            <ForecastChart days={forecast.days} />
          ) : null}
        </div>

        {/* Saved forecasts table */}
        <ForecastTable forecasts={savedForecasts} onDelete={deleteForecast} />
      </main>
    </div>
  );
}
