import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weeklyBaseline: true },
  });

  return NextResponse.json({ weeklyBaseline: user?.weeklyBaseline ?? 500_000 });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weeklyBaseline } = await request.json();

  if (
    typeof weeklyBaseline !== "number" ||
    weeklyBaseline <= 0 ||
    weeklyBaseline > 100_000_000
  ) {
    return NextResponse.json(
      { error: "weeklyBaseline must be a positive number up to 100,000,000" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { weeklyBaseline },
    select: { weeklyBaseline: true },
  });

  return NextResponse.json({ weeklyBaseline: user.weeklyBaseline });
}
