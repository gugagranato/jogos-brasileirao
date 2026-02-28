import { Cadastros } from "@/components/cadastros";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CadastrosPage() {
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
      prizes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
  });

  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  const prizes = await prisma.prize.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <Cadastros
      championships={championships}
      players={players}
      clubs={clubs}
      prizes={prizes}
    />
  );
}
