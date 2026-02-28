import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  const prizes = await prisma.prize.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prizes);
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const championshipId =
    typeof body.championshipId === "string" ? body.championshipId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const details =
    typeof body.details === "string" && body.details.trim() !== ""
      ? body.details.trim()
      : null;
  const value =
    typeof body.value === "string" && body.value.trim() !== ""
      ? body.value.trim()
      : null;

  if (!championshipId || !title) {
    return NextResponse.json(
      { error: "Informe o campeonato e o título da premiação." },
      { status: 400 }
    );
  }

  const prize = await prisma.prize.create({
    data: {
      championshipId,
      title,
      details,
      value,
    },
  });

  return NextResponse.json(prize, { status: 201 });
};
