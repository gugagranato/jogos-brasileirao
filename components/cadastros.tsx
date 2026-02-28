"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiEdit,
  FiFlag,
  FiGift,
  FiImage,
  FiPlusCircle,
  FiSave,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const messageTimeoutMs = 4500;
const minuteMs = 60_000;
const dateInputLength = 10;
const dateTimeInputLength = 16;

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

type GameData = {
  id: string;
  championshipId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  roundLabel: string | null;
  venue: string | null;
  isLastGame: boolean;
  isFinalized: boolean;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
};

type PrizeData = {
  id: string;
  title: string;
  details: string | null;
  value: string | null;
  championshipId: string;
};

type ChampionshipData = {
  id: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  isClosed: boolean;
  games: GameData[];
  prizes: PrizeData[];
};

type CadastrosProps = {
  championships: ChampionshipData[];
  players: PlayerData[];
  clubs: ClubData[];
  prizes: PrizeData[];
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type TabKey = "campeonatos" | "jogos" | "clubes" | "jogadores" | "premiacao";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toDateInputValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * minuteMs);
  return localDate.toISOString().slice(0, dateInputLength);
};

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * minuteMs);
  return localDate.toISOString().slice(0, dateTimeInputLength);
};

export const Cadastros = ({ championships, players, clubs, prizes }: CadastrosProps) => {
  const router = useRouter();
  const [message, setMessage] = useState<MessageState>(null);
  const messageTimerRef = useRef<number | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("campeonatos");

  const [editingChampionshipId, setEditingChampionshipId] = useState<string | null>(null);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);

  const [championshipForm, setChampionshipForm] = useState({
    name: "",
    startsAt: "",
    endsAt: "",
  });

  const [gameForm, setGameForm] = useState({
    championshipId: championships[0]?.id ?? "",
    homeTeam: "",
    awayTeam: "",
    kickoffAt: "",
    roundLabel: "",
    venue: "",
    isLastGame: false,
  });

  const [clubForm, setClubForm] = useState({
    name: "",
    iconUrl: "",
  });

  const [playerForm, setPlayerForm] = useState({
    name: "",
    imageUrl: "",
  });

  const [prizeForm, setPrizeForm] = useState({
    championshipId: championships[0]?.id ?? "",
    title: "",
    details: "",
    value: "",
  });

  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    championships[0]?.id ?? ""
  );

  useEffect(() => {
    if (!selectedChampionshipId && championships[0]) {
      setSelectedChampionshipId(championships[0].id);
    }

    if (!gameForm.championshipId && championships[0]) {
      setGameForm((prev) => ({ ...prev, championshipId: championships[0].id }));
    }

    if (!prizeForm.championshipId && championships[0]) {
      setPrizeForm((prev) => ({ ...prev, championshipId: championships[0].id }));
    }
  }, [championships, selectedChampionshipId, gameForm.championshipId, prizeForm.championshipId]);

  const selectedChampionship = useMemo(() => {
    return championships.find((item) => item.id === selectedChampionshipId) ?? null;
  }, [championships, selectedChampionshipId]);

  const clubNames = useMemo(() => new Set(clubs.map((club) => club.name)), [clubs]);
  const clubsByName = useMemo(() => {
    return new Map(clubs.map((club) => [club.name, club]));
  }, [clubs]);

  const showMessage = (type: MessageState["type"], text: string) => {
    setMessage({ type, text });
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage(null);
    }, messageTimeoutMs);
  };

  const openClubModal = () => {
    setEditingClubId(null);
    setClubForm({ name: "", iconUrl: "" });
    setIsClubModalOpen(true);
  };

  const handleCreateChampionship = async () => {
    const isEditing = Boolean(editingChampionshipId);
    const response = await fetch(
      isEditing ? `/api/championships/${editingChampionshipId}` : "/api/championships",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(championshipForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar campeonato.");
      return;
    }

    setChampionshipForm({ name: "", startsAt: "", endsAt: "" });
    setEditingChampionshipId(null);
    showMessage("success", isEditing ? "Campeonato atualizado." : "Campeonato criado." );
    router.refresh();
  };

  const handleEditChampionship = (championship: ChampionshipData) => {
    setEditingChampionshipId(championship.id);
    setChampionshipForm({
      name: championship.name,
      startsAt: toDateInputValue(championship.startsAt),
      endsAt: toDateInputValue(championship.endsAt),
    });
    setActiveTab("campeonatos");
  };

  const handleCancelChampionshipEdit = () => {
    setEditingChampionshipId(null);
    setChampionshipForm({ name: "", startsAt: "", endsAt: "" });
  };

  const handleCreateGame = async () => {
    const isEditing = Boolean(editingGameId);
    const response = await fetch(
      isEditing ? `/api/games/${editingGameId}` : "/api/games",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar jogo.");
      return;
    }

    setGameForm((prev) => ({
      ...prev,
      homeTeam: "",
      awayTeam: "",
      kickoffAt: "",
      roundLabel: "",
      venue: "",
      isLastGame: false,
    }));
    setEditingGameId(null);
    showMessage("success", isEditing ? "Jogo atualizado." : "Jogo cadastrado.");
    router.refresh();
  };

  const handleEditGame = (game: GameData) => {
    setEditingGameId(game.id);
    setGameForm({
      championshipId: game.championshipId,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      kickoffAt: toDateTimeLocalValue(game.kickoffAt),
      roundLabel: game.roundLabel ?? "",
      venue: game.venue ?? "",
      isLastGame: game.isLastGame,
    });
    setActiveTab("jogos");
  };

  const handleCancelGameEdit = () => {
    setEditingGameId(null);
    setGameForm((prev) => ({
      ...prev,
      homeTeam: "",
      awayTeam: "",
      kickoffAt: "",
      roundLabel: "",
      venue: "",
      isLastGame: false,
    }));
  };

  const handleClubIconChange = (file: File | null) => {
    if (!file) {
      setClubForm((prev) => ({ ...prev, iconUrl: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setClubForm((prev) => ({ ...prev, iconUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateClub = async () => {
    const isEditing = Boolean(editingClubId);
    const response = await fetch(
      isEditing ? `/api/clubs/${editingClubId}` : "/api/clubs",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubForm.name,
          iconUrl: clubForm.iconUrl,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar clube.");
      return;
    }

    setClubForm({ name: "", iconUrl: "" });
    setEditingClubId(null);
    setIsClubModalOpen(false);
    showMessage("success", isEditing ? "Clube atualizado." : "Clube cadastrado.");
    router.refresh();
  };

  const handleEditClub = (club: ClubData) => {
    setEditingClubId(club.id);
    setClubForm({
      name: club.name,
      iconUrl: club.iconUrl ?? "",
    });
    setActiveTab("clubes");
  };

  const handleCancelClubEdit = () => {
    setEditingClubId(null);
    setClubForm({ name: "", iconUrl: "" });
  };

  const handlePlayerImageChange = (file: File | null) => {
    if (!file) {
      setPlayerForm((prev) => ({ ...prev, imageUrl: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPlayerForm((prev) => ({ ...prev, imageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePlayer = async () => {
    const isEditing = Boolean(editingPlayerId);
    const response = await fetch(
      isEditing ? `/api/players/${editingPlayerId}` : "/api/players",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerForm.name,
          imageUrl: playerForm.imageUrl,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar jogador.");
      return;
    }

    setPlayerForm({ name: "", imageUrl: "" });
    setEditingPlayerId(null);
    showMessage("success", isEditing ? "Jogador atualizado." : "Jogador cadastrado.");
    router.refresh();
  };

  const handleEditPlayer = (player: PlayerData) => {
    setEditingPlayerId(player.id);
    setPlayerForm({
      name: player.name,
      imageUrl: player.imageUrl ?? "",
    });
    setActiveTab("jogadores");
  };

  const handleCancelPlayerEdit = () => {
    setEditingPlayerId(null);
    setPlayerForm({ name: "", imageUrl: "" });
  };

  const handleCreatePrize = async () => {
    const isEditing = Boolean(editingPrizeId);
    const response = await fetch(
      isEditing ? `/api/prizes/${editingPrizeId}` : "/api/prizes",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prizeForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage("error", data.error ?? "Erro ao salvar premiacao.");
      return;
    }

    setPrizeForm((prev) => ({
      ...prev,
      title: "",
      details: "",
      value: "",
    }));
    setEditingPrizeId(null);
    showMessage("success", isEditing ? "Premiacao atualizada." : "Premiacao cadastrada.");
    router.refresh();
  };

  const handleEditPrize = (prize: PrizeData) => {
    setEditingPrizeId(prize.id);
    setPrizeForm({
      championshipId: prize.championshipId,
      title: prize.title,
      details: prize.details ?? "",
      value: prize.value ?? "",
    });
    setActiveTab("premiacao");
  };

  const handleCancelPrizeEdit = () => {
    setEditingPrizeId(null);
    setPrizeForm((prev) => ({
      ...prev,
      title: "",
      details: "",
      value: "",
    }));
  };

  const tabs = [
    { key: "campeonatos" as const, label: "Campeonatos", icon: FiFlag },
    { key: "jogos" as const, label: "Jogos", icon: FiPlusCircle },
    { key: "clubes" as const, label: "Clubes", icon: FiShield },
    { key: "jogadores" as const, label: "Jogadores", icon: FiUsers },
    { key: "premiacao" as const, label: "Premiacao", icon: FiGift },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-3">
        <Badge className="w-fit bg-emerald-100 text-emerald-700">Cadastros</Badge>
        <h1 className="text-3xl font-semibold text-slate-900 font-[var(--font-display)]">
          Gerencie tudo em um lugar
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          Cadastre e edite campeonatos, jogos, clubes, jogadores e premiacoes com
          praticidade.
        </p>
      </div>

      <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
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

      {activeTab === "campeonatos" && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FiFlag /> Campeonatos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome do campeonato</Label>
                <Input
                  value={championshipForm.name}
                  onChange={(event) =>
                    setChampionshipForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Brasileirao 2026"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Inicio</Label>
                  <Input
                    type="date"
                    value={championshipForm.startsAt}
                    onChange={(event) =>
                      setChampionshipForm((prev) => ({
                        ...prev,
                        startsAt: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Fim</Label>
                  <Input
                    type="date"
                    value={championshipForm.endsAt}
                    onChange={(event) =>
                      setChampionshipForm((prev) => ({
                        ...prev,
                        endsAt: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateChampionship} className="flex-1">
                  <FiSave /> {editingChampionshipId ? "Atualizar" : "Criar"}
                </Button>
                {editingChampionshipId && (
                  <Button variant="outline" onClick={handleCancelChampionshipEdit}>
                    Cancelar edicao
                  </Button>
                )}
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                {championships.length === 0 && (
                  <span className="text-sm text-slate-500">
                    Nenhum campeonato cadastrado.
                  </span>
                )}
                {championships.map((championship) => (
                  <div
                    key={championship.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">
                        {championship.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {championship.games.length} jogos cadastrados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={championship.isClosed ? "success" : "outline"}>
                        {championship.isClosed ? "Encerrado" : "Ativo"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditChampionship(championship)}
                      >
                        <FiEdit />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {activeTab === "jogos" && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FiPlusCircle /> Jogos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Campeonato</Label>
                    <Select
                      value={gameForm.championshipId}
                      onChange={(event) =>
                        setGameForm((prev) => ({
                          ...prev,
                          championshipId: event.target.value,
                        }))
                      }
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>Mandante</Label>
                      <Select
                        value={gameForm.homeTeam}
                        onChange={(event) =>
                          setGameForm((prev) => ({
                            ...prev,
                            homeTeam: event.target.value,
                          }))
                        }
                        disabled={clubs.length === 0}
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {gameForm.homeTeam &&
                          !clubNames.has(gameForm.homeTeam) && (
                            <option value={gameForm.homeTeam}>
                              {gameForm.homeTeam}
                            </option>
                          )}
                        {clubs.map((club) => (
                          <option key={club.id} value={club.name}>
                            {club.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Visitante</Label>
                      <Select
                        value={gameForm.awayTeam}
                        onChange={(event) =>
                          setGameForm((prev) => ({
                            ...prev,
                            awayTeam: event.target.value,
                          }))
                        }
                        disabled={clubs.length === 0}
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {gameForm.awayTeam &&
                          !clubNames.has(gameForm.awayTeam) && (
                            <option value={gameForm.awayTeam}>
                              {gameForm.awayTeam}
                            </option>
                          )}
                        {clubs.map((club) => (
                          <option key={club.id} value={club.name}>
                            {club.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={openClubModal}>
                      <FiPlusCircle /> Adicionar clube
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Data e hora</Label>
                    <Input
                      type="datetime-local"
                      value={gameForm.kickoffAt}
                      onChange={(event) =>
                        setGameForm((prev) => ({
                          ...prev,
                          kickoffAt: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>Rodada</Label>
                      <Input
                        value={gameForm.roundLabel}
                        onChange={(event) =>
                          setGameForm((prev) => ({
                            ...prev,
                            roundLabel: event.target.value,
                          }))
                        }
                        placeholder="Rodada 5"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Estadio</Label>
                      <Input
                        value={gameForm.venue}
                        onChange={(event) =>
                          setGameForm((prev) => ({
                            ...prev,
                            venue: event.target.value,
                          }))
                        }
                        placeholder="Vila Belmiro"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                      checked={gameForm.isLastGame}
                      onChange={(event) =>
                        setGameForm((prev) => ({
                          ...prev,
                          isLastGame: event.target.checked,
                        }))
                      }
                    />
                    Este e o ultimo jogo do campeonato
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleCreateGame}
                      className="flex-1"
                      disabled={!gameForm.championshipId}
                    >
                      <FiSave /> {editingGameId ? "Atualizar" : "Cadastrar"}
                    </Button>
                    {editingGameId && (
                      <Button variant="outline" onClick={handleCancelGameEdit}>
                        Cancelar edicao
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Filtrar por campeonato</Label>
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

                  <div className="grid gap-3">
                    {selectedChampionship?.games.length === 0 && (
                      <span className="text-sm text-slate-500">
                        Nenhum jogo cadastrado neste campeonato.
                      </span>
                    )}
                    {selectedChampionship?.games.map((game) => (
                      <div
                        key={game.id}
                        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
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
                          <div className="flex items-center gap-2">
                            {game.isLastGame && <Badge variant="warning">Ultimo</Badge>}
                            <Badge variant={game.isFinalized ? "success" : "outline"}>
                              {game.isFinalized ? "Finalizado" : "Aberto"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditGame(game)}
                            >
                              <FiEdit />
                            </Button>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(game.kickoffAt)} · {game.roundLabel ?? "Rodada"} · {game.venue ?? "Estadio"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {activeTab === "clubes" && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FiShield /> Clubes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome do clube</Label>
                <Input
                  value={clubForm.name}
                  onChange={(event) =>
                    setClubForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Santos FC"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Icone do clube</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleClubIconChange(event.target.files?.[0] ?? null)
                    }
                  />
                  {clubForm.iconUrl && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <FiImage /> Icone pronto
                    </div>
                  )}
                </div>
                {clubForm.iconUrl && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <PlayerAvatar
                      name={clubForm.name || "Clube"}
                      imageUrl={clubForm.iconUrl}
                      size="md"
                    />
                    <span className="text-sm text-slate-600">Preview</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setClubForm((prev) => ({ ...prev, iconUrl: "" }))
                      }
                    >
                      Remover icone
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateClub} className="flex-1">
                  <FiSave /> {editingClubId ? "Atualizar" : "Cadastrar"}
                </Button>
                {editingClubId && (
                  <Button variant="outline" onClick={handleCancelClubEdit}>
                    Cancelar edicao
                  </Button>
                )}
              </div>
              <Separator />
              <div className="flex flex-wrap gap-3">
                {clubs.length === 0 && (
                  <span className="text-sm text-slate-500">
                    Nenhum clube cadastrado.
                  </span>
                )}
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <PlayerAvatar name={club.name} imageUrl={club.iconUrl} />
                    <span>{club.name}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClub(club)}
                    >
                      <FiEdit />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {activeTab === "jogadores" && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FiUsers /> Jogadores
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome do jogador</Label>
                <Input
                  value={playerForm.name}
                  onChange={(event) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Guga"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Foto do jogador</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handlePlayerImageChange(event.target.files?.[0] ?? null)
                    }
                  />
                  {playerForm.imageUrl && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <FiImage /> Foto pronta
                    </div>
                  )}
                </div>
                {playerForm.imageUrl && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <PlayerAvatar
                      name={playerForm.name || "Jogador"}
                      imageUrl={playerForm.imageUrl}
                      size="md"
                    />
                    <span className="text-sm text-slate-600">Preview</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPlayerForm((prev) => ({ ...prev, imageUrl: "" }))}
                    >
                      Remover foto
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreatePlayer} className="flex-1">
                  <FiSave /> {editingPlayerId ? "Atualizar" : "Cadastrar"}
                </Button>
                {editingPlayerId && (
                  <Button variant="outline" onClick={handleCancelPlayerEdit}>
                    Cancelar edicao
                  </Button>
                )}
              </div>
              <Separator />
              <div className="flex flex-wrap gap-3">
                {players.length === 0 && (
                  <span className="text-sm text-slate-500">
                    Nenhum jogador cadastrado.
                  </span>
                )}
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <PlayerAvatar name={player.name} imageUrl={player.imageUrl} />
                    <span>{player.name}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditPlayer(player)}
                    >
                      <FiEdit />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {activeTab === "premiacao" && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FiGift /> Premiacao
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Campeonato</Label>
                    <Select
                      value={prizeForm.championshipId}
                      onChange={(event) =>
                        setPrizeForm((prev) => ({
                          ...prev,
                          championshipId: event.target.value,
                        }))
                      }
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
                  <div className="flex flex-col gap-2">
                    <Label>Titulo</Label>
                    <Input
                      value={prizeForm.title}
                      onChange={(event) =>
                        setPrizeForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Camisa oficial"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Detalhes</Label>
                    <Textarea
                      value={prizeForm.details}
                      onChange={(event) =>
                        setPrizeForm((prev) => ({
                          ...prev,
                          details: event.target.value,
                        }))
                      }
                      placeholder="Premio para o campeao do ranking"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Valor (opcional)</Label>
                    <Input
                      value={prizeForm.value}
                      onChange={(event) =>
                        setPrizeForm((prev) => ({
                          ...prev,
                          value: event.target.value,
                        }))
                      }
                      placeholder="R$ 200"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleCreatePrize} disabled={!prizeForm.championshipId}>
                      <FiSave /> {editingPrizeId ? "Atualizar" : "Cadastrar"}
                    </Button>
                    {editingPrizeId && (
                      <Button variant="outline" onClick={handleCancelPrizeEdit}>
                        Cancelar edicao
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {prizes.length === 0 && (
                    <span className="text-sm text-slate-500">
                      Nenhuma premiacao cadastrada.
                    </span>
                  )}
                  {prizes.map((prize) => {
                    const championshipName =
                      championships.find((item) => item.id === prize.championshipId)
                        ?.name ?? "Campeonato";
                    return (
                      <div
                        key={prize.id}
                        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {prize.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{championshipName}</Badge>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditPrize(prize)}
                            >
                              <FiEdit />
                            </Button>
                          </div>
                        </div>
                        {prize.details && (
                          <span className="text-sm text-slate-600">
                            {prize.details}
                          </span>
                        )}
                        {prize.value && (
                          <span className="text-sm font-semibold text-emerald-700">
                            {prize.value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {isClubModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsClubModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cadastro rapido
                </p>
                <h2 className="text-lg font-semibold text-slate-900">Novo clube</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClubModalOpen(false)}
              >
                Fechar
              </Button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome do clube</Label>
                <Input
                  value={clubForm.name}
                  onChange={(event) =>
                    setClubForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Palmeiras"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Icone do clube</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleClubIconChange(event.target.files?.[0] ?? null)
                    }
                  />
                  {clubForm.iconUrl && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <FiImage /> Icone pronto
                    </div>
                  )}
                </div>
                {clubForm.iconUrl && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <PlayerAvatar
                      name={clubForm.name || "Clube"}
                      imageUrl={clubForm.iconUrl}
                      size="md"
                    />
                    <span className="text-sm text-slate-600">Preview</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setClubForm((prev) => ({ ...prev, iconUrl: "" }))
                      }
                    >
                      Remover icone
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateClub} className="flex-1">
                  <FiSave /> Cadastrar
                </Button>
                <Button variant="outline" onClick={() => setIsClubModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
