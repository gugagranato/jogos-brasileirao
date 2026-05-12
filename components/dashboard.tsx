"use client";

import { useEffect, useMemo, useState } from "react";
import { FiAward, FiCalendar } from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PlayerAvatar } from "@/components/player-avatar";

const formatDate = (value: Date | string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const formatTime = (value: Date | string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getGamesWindow = (games: GameData[]) => {
  const sorted = [...games].sort(
    (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  );

  if (sorted.length <= 5) return sorted;

  const now = new Date();
  let nextIndex = sorted.findIndex(
    (game) => new Date(game.kickoffAt) >= now
  );

  if (nextIndex === -1) {
    return sorted.slice(-5);
  }

  let start = Math.max(0, nextIndex - 2);
  let end = Math.min(sorted.length, nextIndex + 3);
  let window = sorted.slice(start, end);

  if (window.length < 5) {
    const missing = 5 - window.length;
    if (start === 0) {
      end = Math.min(sorted.length, end + missing);
    } else if (end === sorted.length) {
      start = Math.max(0, start - missing);
    }
    window = sorted.slice(start, end);
  }

  return window;
};

type GameData = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
  roundLabel: string | null;
  venue: string | null;
  isFinalized: boolean;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
};

type ClubData = {
  id: string;
  name: string;
  iconUrl: string | null;
};

type ChampionshipData = {
  id: string;
  name: string;
  isClosed: boolean;
  games: GameData[];
};

type RankingEntry = {
  playerId: string;
  name: string;
  imageUrl?: string | null;
  points: number;
  exactHits: number;
  resultHits: number;
};

type RankingData = {
  championshipId: string;
  entries: RankingEntry[];
};

type DashboardProps = {
  championships: ChampionshipData[];
  clubs: ClubData[];
  rankings: RankingData[];
};

const getNextGameId = (games: GameData[]) => {
  const now = new Date();
  return games.find((game) => new Date(game.kickoffAt) >= now)?.id ?? null;
};

export const Dashboard = ({ championships, clubs, rankings }: DashboardProps) => {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    championships[0]?.id ?? ""
  );

  useEffect(() => {
    if (!selectedChampionshipId && championships[0]) {
      setSelectedChampionshipId(championships[0].id);
    }
  }, [championships, selectedChampionshipId]);

  const selectedChampionship = useMemo(() => {
    return championships.find((item) => item.id === selectedChampionshipId) ?? null;
  }, [championships, selectedChampionshipId]);

  const clubsByName = useMemo(() => {
    return new Map(clubs.map((club) => [club.name, club]));
  }, [clubs]);

  const ranking = useMemo(() => {
    return (
      rankings.find((item) => item.championshipId === selectedChampionshipId)
        ?.entries ?? []
    );
  }, [rankings, selectedChampionshipId]);

  const games = selectedChampionship?.games ?? [];
  const orderedGames = useMemo(
    () =>
      [...games].sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
      ),
    [games]
  );
  const gamesWindow = useMemo(() => getGamesWindow(games), [games]);
  const nextGameId = useMemo(() => getNextGameId(orderedGames), [orderedGames]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiAward /> Ranking do campeonato
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Campeonato
                </span>
                <Select
                  value={selectedChampionshipId}
                  onChange={(event) => setSelectedChampionshipId(event.target.value)}
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {championships.map((championship) => (
                    <option key={championship.id} value={championship.id}>
                      {championship.name}
                    </option>
                  ))}
                </Select>
              </div>
              {selectedChampionship && (
                <Badge variant={selectedChampionship.isClosed ? "success" : "outline"}>
                  {selectedChampionship.isClosed ? "Encerrado" : "Em andamento"}
                </Badge>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                <span>Jogador</span>
                <span>Pontos</span>
                <span>Exatos</span>
                <span>Resultado</span>
              </div>
              <div className="divide-y divide-slate-100">
                {ranking.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    Cadastre jogadores e palpites para ver o ranking.
                  </div>
                ) : (
                  ranking.map((entry, index) => (
                    <div
                      key={entry.playerId}
                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-4 py-3 text-sm text-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                          {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <PlayerAvatar name={entry.name} imageUrl={entry.imageUrl} />
                          <span>{entry.name}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {entry.points}
                      </span>
                      <span>{entry.exactHits}</span>
                      <span>{entry.resultHits}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiCalendar /> Últimos e próximos jogos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {gamesWindow.length === 0 && (
              <div className="text-sm text-slate-500">
                Nenhum jogo cadastrado.
              </div>
            )}
            {gamesWindow.map((game) => {
              const scoreHome = game.finalHomeScore ?? 0;
              const scoreAway = game.finalAwayScore ?? 0;
              const isNext = nextGameId === game.id;

              return (
                <div
                  key={game.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>
                      {formatDate(game.kickoffAt)} · {formatTime(game.kickoffAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {isNext && <Badge variant="success">Próximo</Badge>}
                      <Badge variant={game.isFinalized ? "success" : "outline"}>
                        {game.isFinalized ? "Finalizado" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                        <span className="flex items-center gap-2">
                          <PlayerAvatar
                            name={game.homeTeam}
                            imageUrl={clubsByName.get(game.homeTeam)?.iconUrl ?? null}
                          />
                          <span>{game.homeTeam}</span>
                        </span>
                        <span className="text-slate-400">x</span>
                        <span className="flex items-center gap-2">
                          <PlayerAvatar
                            name={game.awayTeam}
                            imageUrl={clubsByName.get(game.awayTeam)?.iconUrl ?? null}
                          />
                          <span>{game.awayTeam}</span>
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {game.roundLabel ?? "Rodada"} · {game.venue ?? "Estádio"}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      {scoreHome} x {scoreAway}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
