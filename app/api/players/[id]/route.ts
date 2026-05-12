import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await Promise.resolve(params);
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

  const player = await prisma.player.update({
    where: { id },
    data: { name, imageUrl },
  });

  return NextResponse.json(player);
};
