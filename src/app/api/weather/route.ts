import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchWeatherForecast, UK_CITIES } from "@/lib/weather";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const city = request.nextUrl.searchParams.get("city") || "London";

  if (!UK_CITIES.find((c) => c.name === city)) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weeklyBaseline: true },
  });

  try {
    const forecast = await fetchWeatherForecast(
      city,
      user?.weeklyBaseline ?? 500_000
    );
    return NextResponse.json(forecast);
  } catch (err) {
    console.error("Weather fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 502 }
    );
  }
}
