import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clubs);
};

export const POST = async (request: Request) => {
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

  const club = await prisma.club.create({
    data: { name, iconUrl },
  });

  return NextResponse.json(club, { status: 201 });
};
