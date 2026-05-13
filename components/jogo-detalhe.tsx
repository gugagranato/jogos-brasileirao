"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheckCircle, FiDownload, FiImage, FiSave, FiShare2, FiX } from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlayerAvatar } from "@/components/player-avatar";
import { cn } from "@/lib/utils";

const messageTimeoutMs = 4500;
const defaultScore = 0;

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

type JogoDetalheProps = {
  game: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    kickoffAt: Date;
    roundLabel: string | null;
    venue: string | null;
    isFinalized: boolean;
    finalHomeScore: number | null;
    finalAwayScore: number | null;
    championship: {
      name: string;
    };
  };
  clubs: {
    id: string;
    name: string;
    iconUrl: string | null;
  }[];
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

export const JogoDetalhe = ({ game, clubs }: JogoDetalheProps) => {
  const router = useRouter();
  const [message, setMessage] = useState<MessageState>(null);
  const messageTimerRef = useRef<number | null>(null);
  const clubsByName = useMemo(() => new Map(clubs.map((club) => [club.name, club])), [clubs]);

  const [arteImage, setArteImage] = useState<string | null>(null);
  const [arteLoading, setArteLoading] = useState(false);

  const [form, setForm] = useState({
    homeScore: String(game.finalHomeScore ?? defaultScore),
    awayScore: String(game.finalAwayScore ?? defaultScore),
  });

  const showMessage = (type: NonNullable<MessageState>["type"], text: string) => {
    setMessage({ type, text });
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage(null);
    }, messageTimeoutMs);
  };

  const handleGerarArte = async () => {
    setArteLoading(true);
    try {
      const response = await fetch(`/api/games/${game.id}/arte`, { method: "POST" });
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
    if (!arteImage) return;
    const a = document.createElement("a");
    a.href = arteImage;
    a.download = `arte-${game.homeTeam}-x-${game.awayTeam}.png`.replace(/\s+/g, "-").toLowerCase();
    a.click();
  };

  const handleShareArte = async () => {
    if (!arteImage || !navigator.share) return;
    const res = await fetch(arteImage);
    const blob = await res.blob();
    const file = new File([blob], `arte-jogo.png`, { type: "image/png" });
    await navigator.share({ files: [file], title: `${game.homeTeam} x ${game.awayTeam}` });
  };

  const handleSave = async () => {
    const response = await fetch(`/api/games/${game.id}/result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        finalHomeScore: form.homeScore,
        finalAwayScore: form.awayScore,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar placar.");
      return;
    }

    showMessage("success", "Placar atualizado.");
    router.refresh();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jogos"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <FiArrowLeft /> Voltar para jogos
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGerarArte} disabled={arteLoading}>
            <FiImage />
            {arteLoading ? "Gerando arte..." : "Gerar Arte"}
          </Button>
          {game.isFinalized ? (
            <Badge variant="success">Finalizado</Badge>
          ) : (
            <Badge variant="outline">Pendente</Badge>
          )}
        </div>
      </div>

      {arteImage && (
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
              alt={`Arte ${game.homeTeam} x ${game.awayTeam}`}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Atualizar resultado
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {game.championship.name}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xl font-semibold text-slate-900">
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={game.homeTeam}
                  imageUrl={clubsByName.get(game.homeTeam)?.iconUrl ?? null}
                />
                <span>{game.homeTeam}</span>
              </div>
              <span className="text-slate-400">x</span>
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={game.awayTeam}
                  imageUrl={clubsByName.get(game.awayTeam)?.iconUrl ?? null}
                />
                <span>{game.awayTeam}</span>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              {game.venue ?? "Estadio"} · {formatGameMeta(game.kickoffAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-3xl font-semibold text-slate-900">
            <Input
              className="w-24 text-center"
              inputMode="numeric"
              value={form.homeScore}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  homeScore: event.target.value,
                }))
              }
            />
            <span className="text-slate-300">x</span>
            <Input
              className="w-24 text-center"
              inputMode="numeric"
              value={form.awayScore}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  awayScore: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={handleSave}>
              <FiSave /> Salvar placar
            </Button>
            <span className="text-xs text-slate-500">
              Finalize o jogo na tela de jogos para pontuar.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
