import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const { id } = await Promise.resolve(params);
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const iconUrl =
    typeof body.iconUrl === "string" && body.iconUrl.trim() !== ""
      ? body.iconUrl.trim()
      : null;

  if (!name) {
    return NextResponse.json(
      { error: "Informe o nome do clube." },
      { status: 400 }
    );
  }

  const club = await prisma.club.update({
    where: { id },
    data: { name, iconUrl },
  });

  return NextResponse.json(club);
};
