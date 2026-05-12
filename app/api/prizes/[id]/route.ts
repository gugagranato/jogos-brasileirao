import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await Promise.resolve(params);
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
      { error: "Informe o campeonato e o titulo da premiacao." },
      { status: 400 }
    );
  }

  const prize = await prisma.prize.update({
    where: { id },
    data: {
      championshipId,
      title,
      details,
      value,
    },
  });

  return NextResponse.json(prize);
};
