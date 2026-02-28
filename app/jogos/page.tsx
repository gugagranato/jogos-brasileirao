import { Jogos } from "@/components/jogos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const championships = await prisma.championship.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      games: {
        orderBy: { kickoffAt: "asc" },
        include: {
          predictions: {
            include: {
              player: true,
            },
          },
        },
      },
    },
  });

  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
  });

  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  return <Jogos championships={championships} players={players} clubs={clubs} />;
}
