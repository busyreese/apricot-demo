import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const forecast = await prisma.forecast.findFirst({
    where: { id: params.id, userId },
  });

  if (!forecast) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.forecast.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
