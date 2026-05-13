"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFrown,
  FiImage,
  FiSave,
  FiShare2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Crown } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getPredictionPoints } from "@/lib/points";
import { cn } from "@/lib/utils";
import { generateResultadoImage } from "@/lib/canvas-art";

const messageTimeoutMs = 4500;
const defaultScore = 0;

type PlayerData = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type ClubData = {
  id: string;
  name: string;
  iconUrl: string | null;
};

type PredictionData = {
  id: string;
  homeScore: number;
  awayScore: number;
  player: PlayerData;
};

type GameData = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
  roundLabel: string | null;
  venue: string | null;
  isLastGame: boolean;
  isFinalized: boolean;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  predictions: PredictionData[];
};

type ChampionshipData = {
  id: string;
  name: string;
  isClosed: boolean;
  games: GameData[];
};

type JogosProps = {
  championships: ChampionshipData[];
  players: PlayerData[];
  clubs: ClubData[];
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const formatGameMeta = (value: Date | string) => {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const weekdayTitle = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${datePart} · ${weekdayTitle} · ${time}`;
};

const getDefaultGameIndex = (games: GameData[]) => {
  if (games.length === 0) return 0;
  let lastFinalizedIndex = -1;
  games.forEach((game, index) => {
    if (game.isFinalized) {
      lastFinalizedIndex = index;
    }
  });
  if (lastFinalizedIndex === -1) return 0;
  return Math.min(lastFinalizedIndex + 1, games.length - 1);
};

export const Jogos = ({ championships, players, clubs }: JogosProps) => {
  const router = useRouter();
  const [message, setMessage] = useState<MessageState>(null);
  const messageTimerRef = useRef<number | null>(null);
  const lockedGameIdRef = useRef<string | null>(null);

  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    championships[0]?.id ?? ""
  );
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    players[0]?.id ?? ""
  );
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [arteImage, setArteImage] = useState<string | null>(null);
  const [arteLoading, setArteLoading] = useState(false);
  const [resultadoImage, setResultadoImage] = useState<string | null>(null);
  const [resultadoLoading, setResultadoLoading] = useState(false);

  const [predictionForm, setPredictionForm] = useState({
    homeScore: String(defaultScore),
    awayScore: String(defaultScore),
  });

  useEffect(() => {
    if (!selectedChampionshipId && championships[0]) {
      setSelectedChampionshipId(championships[0].id);
    }
  }, [championships, selectedChampionshipId]);

  useEffect(() => {
    if (!selectedPlayerId && players[0]) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const selectedChampionship = useMemo(() => {
    return championships.find((item) => item.id === selectedChampionshipId) ?? null;
  }, [championships, selectedChampionshipId]);

  const clubsByName = useMemo(() => {
    return new Map(clubs.map((club) => [club.name, club]));
  }, [clubs]);

  const orderedGames = useMemo(() => {
    return [...(selectedChampionship?.games ?? [])].sort(
      (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
    );
  }, [selectedChampionship]);

  useEffect(() => {
    if (lockedGameIdRef.current) {
      const lockedIndex = orderedGames.findIndex((g) => g.id === lockedGameIdRef.current);
      lockedGameIdRef.current = null;
      if (lockedIndex >= 0) {
        setSelectedGameIndex(lockedIndex);
        setSelectedGameId(orderedGames[lockedIndex].id);
        return;
      }
    }
    const defaultIndex = getDefaultGameIndex(orderedGames);
    const game = orderedGames[defaultIndex];
    setSelectedGameIndex(defaultIndex);
    setSelectedGameId(game?.id ?? "");
  }, [orderedGames]);

  const selectedGame = orderedGames.find((game) => game.id === selectedGameId) ?? null;

  useEffect(() => {
    const index = orderedGames.findIndex((game) => game.id === selectedGameId);
    if (index >= 0) {
      setSelectedGameIndex(index);
    }
  }, [orderedGames, selectedGameId]);

  const currentPrediction = useMemo(() => {
    if (!selectedGame || !selectedPlayerId) return null;
    return (
      selectedGame.predictions.find(
        (prediction) => prediction.player.id === selectedPlayerId
      ) ?? null
    );
  }, [selectedGame, selectedPlayerId]);

  const finalScore = useMemo(() => {
    if (!selectedGame || !selectedGame.isFinalized) return null;
    if (
      selectedGame.finalHomeScore === null ||
      selectedGame.finalAwayScore === null
    ) {
      return null;
    }
    return {
      home: selectedGame.finalHomeScore,
      away: selectedGame.finalAwayScore,
    };
  }, [selectedGame]);

  const predictionsWithPoints = useMemo(() => {
    if (!selectedGame) return [] as Array<PredictionData & { points: number | null }>;
    return selectedGame.predictions.map((prediction) => {
      const points = finalScore
        ? getPredictionPoints(
            { home: prediction.homeScore, away: prediction.awayScore },
            finalScore
          )
        : null;
      return {
        ...prediction,
        points,
      };
    });
  }, [selectedGame, finalScore]);

  const maxPoints = useMemo(() => {
    if (!finalScore) return null;
    return predictionsWithPoints.reduce((acc, prediction) => {
      if (prediction.points === null) return acc;
      return Math.max(acc, prediction.points);
    }, 0);
  }, [predictionsWithPoints, finalScore]);

  const sortedPredictions = useMemo(() => {
    if (!finalScore) {
      return [...predictionsWithPoints].sort((a, b) =>
        a.player.name.localeCompare(b.player.name)
      );
    }
    return [...predictionsWithPoints].sort((a, b) => {
      const aPoints = a.points ?? 0;
      const bPoints = b.points ?? 0;
      if (aPoints !== bPoints) return bPoints - aPoints;
      return a.player.name.localeCompare(b.player.name);
    });
  }, [predictionsWithPoints, finalScore]);

  const showMessage = (type: NonNullable<MessageState>["type"], text: string) => {
    setMessage({ type, text });
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage(null);
    }, messageTimeoutMs);
  };

  const resetPredictionForm = () => {
    setPredictionForm({
      homeScore: String(defaultScore),
      awayScore: String(defaultScore),
    });
  };

  const normalizeScoreInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly === "") return String(defaultScore);
    return String(Number.parseInt(digitsOnly, 10));
  };

  const handleSavePrediction = async () => {
    if (!selectedGameId || !selectedPlayerId) {
      showMessage("error", "Selecione jogo e jogador.");
      return;
    }

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: selectedGameId,
        playerId: selectedPlayerId,
        homeScore: predictionForm.homeScore,
        awayScore: predictionForm.awayScore,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar palpite.");
      return;
    }

    showMessage("success", data.message ?? "Palpite salvo.");
    resetPredictionForm();
    lockedGameIdRef.current = selectedGameId;
    router.refresh();
    setIsPredictionModalOpen(false);
  };

  const handleGerarArte = async () => {
    if (!selectedGameId) return;
    setArteLoading(true);
    try {
      const response = await fetch(`/api/games/${selectedGameId}/arte`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        showMessage("error", data.error ?? "Erro ao gerar arte.");
        return;
      }
      setArteImage(data.image);
    } finally {
      setArteLoading(false);
    }
  };

  const handleDownloadArte = () => {
    if (!arteImage || !selectedGame) return;
    const a = document.createElement("a");
    a.href = arteImage;
    a.download = `arte-${selectedGame.homeTeam}-x-${selectedGame.awayTeam}.png`.replace(/\s+/g, "-").toLowerCase();
    a.click();
  };

  const handleShareArte = async () => {
    if (!arteImage || !selectedGame || !navigator.share) return;
    const res = await fetch(arteImage);
    const blob = await res.blob();
    const file = new File([blob], "arte-jogo.png", { type: "image/png" });
    await navigator.share({ files: [file], title: `${selectedGame.homeTeam} x ${selectedGame.awayTeam}` });
  };

  const handleGerarResultado = async () => {
    if (!selectedGame || !selectedChampionship || !selectedGame.isFinalized) return;
    setResultadoLoading(true);
    try {
      const image = await generateResultadoImage({
        homeTeam: selectedGame.homeTeam,
        awayTeam: selectedGame.awayTeam,
        homeScore: selectedGame.finalHomeScore ?? 0,
        awayScore: selectedGame.finalAwayScore ?? 0,
        roundLabel: selectedGame.roundLabel,
        kickoffAt: selectedGame.kickoffAt,
        championshipName: selectedChampionship.name,
        predictions: sortedPredictions.map((p) => ({
          playerName: p.player.name,
          playerImageUrl: p.player.imageUrl,
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          points: p.points ?? 0,
        })),
        homeClubIconUrl: clubsByName.get(selectedGame.homeTeam)?.iconUrl ?? null,
        awayClubIconUrl: clubsByName.get(selectedGame.awayTeam)?.iconUrl ?? null,
      });
      setResultadoImage(image);
    } finally {
      setResultadoLoading(false);
    }
  };

  const handleDownloadResultado = () => {
    if (!resultadoImage || !selectedGame) return;
    const a = document.createElement("a");
    a.href = resultadoImage;
    a.download = `resultado-${selectedGame.homeTeam}-x-${selectedGame.awayTeam}.png`.replace(/\s+/g, "-").toLowerCase();
    a.click();
  };

  const handleShareResultado = async () => {
    if (!resultadoImage || !selectedGame || !navigator.share) return;
    const res = await fetch(resultadoImage);
    const blob = await res.blob();
    const file = new File([blob], "resultado.png", { type: "image/png" });
    await navigator.share({ files: [file], title: `${selectedGame.homeTeam} x ${selectedGame.awayTeam}` });
  };

  const handleFinalizeGame = async () => {
    if (!selectedGameId) {
      showMessage("error", "Selecione um jogo.");
      return;
    }

    const response = await fetch(`/api/games/${selectedGameId}/result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFinalized: true }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao finalizar jogo.");
      return;
    }

    showMessage("success", "Jogo finalizado.");
    lockedGameIdRef.current = selectedGameId;
    router.refresh();
  };

  const handlePrevGame = () => {
    if (orderedGames.length === 0) return;
    const nextIndex = selectedGameIndex > 0 ? selectedGameIndex - 1 : 0;
    setSelectedGameIndex(nextIndex);
    setSelectedGameId(orderedGames[nextIndex]?.id ?? "");
  };

  const handleNextGame = () => {
    if (orderedGames.length === 0) return;
    const lastIndex = orderedGames.length - 1;
    const nextIndex =
      selectedGameIndex < lastIndex ? selectedGameIndex + 1 : lastIndex;
    setSelectedGameIndex(nextIndex);
    setSelectedGameId(orderedGames[nextIndex]?.id ?? "");
  };

  const homeScoreDisplay = selectedGame?.finalHomeScore ?? defaultScore;
  const awayScoreDisplay = selectedGame?.finalAwayScore ?? defaultScore;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-3">
        <Badge className="w-fit bg-emerald-100 text-emerald-700">Jogos</Badge>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-(--font-display) text-slate-900">
            Jogos do campeonato
          </h1>
          <div className="w-full max-w-xs">
            <Select
              value={selectedChampionshipId}
              onChange={(event) => setSelectedChampionshipId(event.target.value)}
            >
              <option value="" disabled>
                Selecione o campeonato
              </option>
              {championships.map((championship) => (
                <option key={championship.id} value={championship.id}>
                  {championship.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          <FiCheckCircle />
          {message.text}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-emerald-200/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiCalendar /> Jogos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevGame}
                disabled={orderedGames.length === 0 || selectedGameIndex === 0}
              >
                <FiChevronLeft />
              </Button>
              <div className="text-center">
                <div className="text-sm font-semibold text-emerald-900">
                  {selectedGame?.roundLabel ?? "Rodada"}
                </div>
                {selectedGame && (
                  <div className="text-xs text-emerald-700">
                    {formatGameMeta(selectedGame.kickoffAt)}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextGame}
                disabled={
                  orderedGames.length === 0 ||
                  selectedGameIndex >= orderedGames.length - 1
                }
              >
                <FiChevronRight />
              </Button>
            </div>

            {selectedGame ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-center">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {selectedChampionship?.name ?? "Campeonato"}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar
                        name={selectedGame.homeTeam}
                        imageUrl={clubsByName.get(selectedGame.homeTeam)?.iconUrl ?? null}
                      />
                      <span>{selectedGame.homeTeam}</span>
                    </div>
                    <span className="text-slate-400">x</span>
                    <div className="flex items-center gap-2">
                      <PlayerAvatar
                        name={selectedGame.awayTeam}
                        imageUrl={clubsByName.get(selectedGame.awayTeam)?.iconUrl ?? null}
                      />
                      <span>{selectedGame.awayTeam}</span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {selectedGame.venue ?? "Estadio"} · {formatGameMeta(selectedGame.kickoffAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-3xl font-semibold text-slate-900">
                  <span>{homeScoreDisplay}</span>
                  <span className="text-slate-300">x</span>
                  <span>{awayScoreDisplay}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={`/jogos/${selectedGame.id}`}
                    className={cn(buttonVariants({ variant: "outline" }))}
                  >
                    Atualizar resultado
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleGerarArte}
                    disabled={!selectedGameId || arteLoading}
                  >
                    <FiImage />
                    {arteLoading ? "Gerando..." : "Gerar Arte"}
                  </Button>
                  {selectedGame.isFinalized && (
                    <Button
                      variant="outline"
                      onClick={handleGerarResultado}
                      disabled={resultadoLoading}
                    >
                      <FiAward />
                      {resultadoLoading ? "Gerando..." : "Gerar Resultado"}
                    </Button>
                  )}
                  <Button
                    onClick={handleFinalizeGame}
                    disabled={!selectedGameId || selectedGame?.isFinalized}
                  >
                    <FiCheckCircle /> Finalizar jogo
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                  {selectedGame.isFinalized ? (
                    <Badge variant="success">Finalizado</Badge>
                  ) : (
                    <Badge variant="outline">Pendente</Badge>
                  )}
                  {selectedGame.isLastGame && (
                    <Badge variant="warning">Ultimo jogo</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Nenhum jogo cadastrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiUsers /> Palpites
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">
                {selectedGame ? "Palpites do jogo selecionado" : "Selecione um jogo"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  resetPredictionForm();
                  setIsPredictionModalOpen(true);
                }}
                disabled={!selectedGameId}
              >
                Registrar palpite
              </Button>
            </div>

            {sortedPredictions.length === 0 && (
              <div className="text-sm text-slate-500">
                Nenhum palpite registrado.
              </div>
            )}
            {sortedPredictions.map((prediction) => {
              const points = prediction.points;
              const isExact = points === 3;
              const isResult = points === 1;
              const isLoser = points === 0;
              const isWinner =
                maxPoints !== null &&
                maxPoints > 0 &&
                points !== null &&
                points === maxPoints;

              const baseClasses =
                "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3";
              const styleClasses = finalScore
                ? isExact
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : isResult
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                : "border-slate-200 bg-white text-slate-600";

              return (
                <div key={prediction.id} className={`${baseClasses} ${styleClasses}`}>
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      name={prediction.player.name}
                      imageUrl={prediction.player.imageUrl}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">
                        {prediction.player.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {prediction.homeScore} x {prediction.awayScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {finalScore && points !== null && <span>{points} pts</span>}
                    {isWinner && <Crown className="h-4 w-4 text-amber-500" />}
                    {finalScore && isLoser && <FiFrown className="text-slate-400" />}
                  </div>
                </div>
              );
            })}
            {finalScore && sortedPredictions.length > 0 && (
              <div className="text-xs text-slate-500">
                Exato = verde, resultado = amarelo, sem pontos = cinza.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {resultadoImage && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-4 shadow-2xl">
            <button
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setResultadoImage(null)}
            >
              <FiX size={18} />
            </button>
            <p className="text-sm font-semibold text-slate-700">Resultado gerado</p>
            <img
              src={resultadoImage}
              alt={`Resultado ${selectedGame.homeTeam} x ${selectedGame.awayTeam}`}
              className="w-full rounded-xl"
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleDownloadResultado}>
                <FiDownload /> Baixar
              </Button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button className="flex-1" variant="outline" onClick={handleShareResultado}>
                  <FiShare2 /> Compartilhar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {arteImage && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-4 shadow-2xl">
            <button
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setArteImage(null)}
            >
              <FiX size={18} />
            </button>
            <p className="text-sm font-semibold text-slate-700">Arte gerada</p>
            <img
              src={arteImage}
              alt={`Arte ${selectedGame.homeTeam} x ${selectedGame.awayTeam}`}
              className="w-full rounded-xl object-cover"
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleDownloadArte}>
                <FiDownload /> Baixar
              </Button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button className="flex-1" variant="outline" onClick={handleShareArte}>
                  <FiShare2 /> Compartilhar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {isPredictionModalOpen && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Registrar palpite
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPredictionModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Jogador</Label>
                <Select
                  value={selectedPlayerId}
                  onChange={(event) => {
                    setSelectedPlayerId(event.target.value);
                    resetPredictionForm();
                  }}
                >
                  <option value="" disabled>
                    Selecione o jogador
                  </option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar
                      name={selectedGame.homeTeam}
                      imageUrl={clubsByName.get(selectedGame.homeTeam)?.iconUrl ?? null}
                      size="sm"
                    />
                    <span>{selectedGame.homeTeam}</span>
                  </div>
                  <span className="text-slate-400">x</span>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar
                      name={selectedGame.awayTeam}
                      imageUrl={clubsByName.get(selectedGame.awayTeam)?.iconUrl ?? null}
                      size="sm"
                    />
                    <span>{selectedGame.awayTeam}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Input
                    className="w-20 text-center"
                    inputMode="numeric"
                    value={predictionForm.homeScore}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                      setPredictionForm((prev) => ({
                        ...prev,
                        homeScore: normalizeScoreInput(event.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                  <span className="text-slate-400">x</span>
                  <Input
                    className="w-20 text-center"
                    inputMode="numeric"
                    value={predictionForm.awayScore}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                      setPredictionForm((prev) => ({
                        ...prev,
                        awayScore: normalizeScoreInput(event.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              {currentPrediction && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Palpite atual: {currentPrediction.homeScore} x {currentPrediction.awayScore}.
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPredictionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePrediction} disabled={!selectedGameId}>
                  <FiSave /> Salvar palpite
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
