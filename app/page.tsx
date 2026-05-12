import { Dashboard } from "@/components/dashboard";
import { prisma } from "@/lib/prisma";
import { buildRanking } from "@/lib/ranking";

export const dynamic = "force-dynamic";

type PlayerRow = Awaited<ReturnType<typeof prisma.player.findMany>>[number];
type ChampionshipRow = Awaited<ReturnType<typeof prisma.championship.findMany<{ include: { games: { include: { predictions: true } } } }>>>[number];

export default async function Home() {
  const championships = await prisma.championship.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      games: {
        orderBy: { kickoffAt: "asc" },
        include: {
          predictions: true,
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

  const rankings = championships.map((championship: ChampionshipRow) => {
    const playerEntries = players.map((player: PlayerRow) => ({
      playerId: player.id,
      name: player.name,
      imageUrl: player.imageUrl,
      predictions: [] as {
        homeScore: number;
        awayScore: number;
        game: {
          finalHomeScore: number | null;
          finalAwayScore: number | null;
          isFinalized: boolean;
        };
      }[],
    }));

    const playerMap = new Map(
      playerEntries.map((entry) => [entry.playerId, entry])
    );

    championship.games.forEach((game) => {
      game.predictions.forEach((prediction) => {
        const entry = playerMap.get(prediction.playerId);
        if (!entry) return;
        entry.predictions.push({
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
          game: {
            finalHomeScore: game.finalHomeScore,
            finalAwayScore: game.finalAwayScore,
            isFinalized: game.isFinalized,
          },
        });
      });
    });

    return {
      championshipId: championship.id,
      entries: buildRanking(playerEntries),
    };
  });

  return (
    <Dashboard championships={championships} clubs={clubs} rankings={rankings} />
  );
}
