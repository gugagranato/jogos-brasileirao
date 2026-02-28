import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(players);
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.trim() !== ""
      ? body.imageUrl.trim()
      : null;

  if (!name) {
    return NextResponse.json(
      { error: "Informe o nome do jogador." },
      { status: 400 }
    );
  }

  const player = await prisma.player.create({
    data: { name, imageUrl },
  });

  return NextResponse.json(player, { status: 201 });
};
