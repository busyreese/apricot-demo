"use client";

import { useState } from "react";

interface SavedForecast {
  id: string;
  createdAt: string;
  location: string;
  weekStart: string;
  totalForecast: number;
  baseline: number;
  adjustmentPct: number;
}

interface ForecastTableProps {
  forecasts: SavedForecast[];
  onDelete: (id: string) => void;
}

export default function ForecastTable({
  forecasts,
  onDelete,
}: ForecastTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (forecasts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-gray-500 text-sm">
          No saved forecasts yet. Hit <strong>Save Forecast</strong> above to
          store one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          Saved Forecasts
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Saved
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                City
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Week Starting
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Weekly Forecast
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                vs £500k Baseline
              </th>
              <th className="px-6 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {forecasts.map((f) => {
              const diff = f.adjustmentPct * 100;
              return (
                <tr
                  key={f.id}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(f.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {new Date(f.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {f.location}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(f.weekStart).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    £{Math.round(f.totalForecast).toLocaleString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        diff > 0
                          ? "bg-green-100 text-green-700"
                          : diff < 0
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(f.id)}
                      disabled={deletingId === f.id}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-40"
                      aria-label="Delete forecast"
                    >
                      {deletingId === f.id ? "…" : "×"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
