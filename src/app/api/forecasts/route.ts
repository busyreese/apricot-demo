import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const forecasts = await prisma.forecast.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(forecasts);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();

  const forecast = await prisma.forecast.create({
    data: {
      userId,
      location: body.city,
      weekStart: new Date(body.days[0].date + "T00:00:00Z"),
      totalForecast: body.weeklyTotal,
      baseline: body.weeklyBaseline,
      adjustmentPct: body.adjustmentPct,
      days: body.days,
    },
  });

  return NextResponse.json(forecast, { status: 201 });
}
