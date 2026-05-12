import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const parseScore = (value: unknown) => {
  if (typeof value === "number") return Math.floor(value);
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : Math.floor(parsed);
  }
  return null;
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await Promise.resolve(params);
  const body = await request.json();
  const finalHomeScore = parseScore(body.finalHomeScore);
  const finalAwayScore = parseScore(body.finalAwayScore);
  const isFinalized = typeof body.isFinalized === "boolean" ? body.isFinalized : null;

  const shouldUpdateScores =
    finalHomeScore !== null && finalAwayScore !== null;

  if (!shouldUpdateScores && isFinalized === null) {
    return NextResponse.json(
      { error: "Informe o placar final." },
      { status: 400 }
    );
  }

  let fallbackScores: { finalHomeScore: number; finalAwayScore: number } | null =
    null;

  if (!shouldUpdateScores && isFinalized === true) {
    const existingGame = await prisma.game.findUnique({
      where: { id },
      select: { finalHomeScore: true, finalAwayScore: true },
    });

    fallbackScores = {
      finalHomeScore: existingGame?.finalHomeScore ?? 0,
      finalAwayScore: existingGame?.finalAwayScore ?? 0,
    };
  }

  const game = await prisma.game.update({
    where: { id },
    data: {
      ...(shouldUpdateScores
        ? { finalHomeScore, finalAwayScore }
        : {}),
      ...(fallbackScores ?? {}),
      ...(isFinalized !== null ? { isFinalized } : {}),
    },
    include: {
      championship: {
        include: {
          games: true,
        },
      },
    },
  });

  const allFinalized = game.championship.games.every((item: { isFinalized: boolean }) => item.isFinalized);

  if (!game.championship.isClosed && game.isFinalized && (game.isLastGame || allFinalized)) {
    await prisma.championship.update({
      where: { id: game.championshipId },
      data: { isClosed: true },
    });
  }

  return NextResponse.json(game);
};
