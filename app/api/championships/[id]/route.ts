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
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const startsAt = parseDateValue(body.startsAt);
  const endsAt = parseDateValue(body.endsAt);

  if (!name) {
    return NextResponse.json(
      { error: "Informe o nome do campeonato." },
      { status: 400 }
    );
  }

  const championship = await prisma.championship.update({
    where: { id },
    data: {
      name,
      startsAt,
      endsAt,
    },
  });

  return NextResponse.json(championship);
};
