import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const parseDateValue = (value: unknown) => {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const PATCH = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const { id } = await Promise.resolve(params);
  const body = await request.json();
  const championshipId =
    typeof body.championshipId === "string" ? body.championshipId : "";
  const homeTeam = typeof body.homeTeam === "string" ? body.homeTeam.trim() : "";
  const awayTeam = typeof body.awayTeam === "string" ? body.awayTeam.trim() : "";
  const kickoffAt = parseDateValue(body.kickoffAt);
  const roundLabelRaw =
    typeof body.roundLabel === "string" ? body.roundLabel.trim() : "";
  const venueRaw = typeof body.venue === "string" ? body.venue.trim() : "";
  const roundLabel = roundLabelRaw ? roundLabelRaw : null;
  const venue = venueRaw ? venueRaw : null;
  const isLastGame = Boolean(body.isLastGame);

  if (!championshipId || !homeTeam || !awayTeam || !kickoffAt) {
    return NextResponse.json(
      { error: "Preencha campeonato, times e data/hora." },
      { status: 400 }
    );
  }

  const game = await prisma.game.update({
    where: { id },
    data: {
      championshipId,
      homeTeam,
      awayTeam,
      kickoffAt,
      roundLabel,
      venue,
      isLastGame,
    },
  });

  return NextResponse.json(game);
};
