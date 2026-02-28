import { notFound } from "next/navigation";

import { JogoDetalhe } from "@/components/jogo-detalhe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JogoDetalhePage({ params }: PageProps) {
  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      championship: true,
    },
  });

  if (!game) {
    notFound();
  }

  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  return <JogoDetalhe game={game} clubs={clubs} />;
}
