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

export const POST = async (request: Request) => {
  const body = await request.json();
  const gameId = typeof body.gameId === "string" ? body.gameId : "";
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  const homeScore = parseScore(body.homeScore);
  const awayScore = parseScore(body.awayScore);

  if (!gameId || !playerId || homeScore === null || awayScore === null) {
    return NextResponse.json(
      { error: "Informe jogador, jogo e placar." },
      { status: 400 }
    );
  }

  const existing = await prisma.prediction.findUnique({
    where: {
      gameId_playerId: {
        gameId,
        playerId,
      },
    },
  });

  if (existing) {
    const prediction = await prisma.prediction.update({
      where: { id: existing.id },
      data: { homeScore, awayScore },
    });

    return NextResponse.json({
      prediction,
      updated: true,
      message: "Palpite atualizado.",
    });
  }

  const prediction = await prisma.prediction.create({
    data: {
      gameId,
      playerId,
      homeScore,
      awayScore,
    },
  });

  return NextResponse.json(
    {
      prediction,
      updated: false,
      message: "Palpite registrado.",
    },
    { status: 201 }
  );
};
