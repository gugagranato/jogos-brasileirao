import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await Promise.resolve(params);
  const championship = await prisma.championship.update({
    where: { id },
    data: { isClosed: true },
  });

  return NextResponse.json(championship);
};
