import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import OpenAI from "openai";


// Principais jogadores por clube brasileiro (Série A e B)
const TEAM_PLAYERS: Record<string, string[]> = {
  "flamengo": ["Gerson", "Arrascaeta", "Pedro", "Wesley"],
  "palmeiras": ["Raphael Veiga", "Flaco López", "Maurício", "Rony"],
  "atletico-mg": ["Hulk", "Paulinho", "Guilherme Arana", "Deyverson"],
  "atlético mineiro": ["Hulk", "Paulinho", "Guilherme Arana", "Deyverson"],
  "fluminense": ["Germán Cano", "Ganso", "Jhon Arias", "Thiago Silva"],
  "botafogo": ["Luiz Henrique", "Savarino", "Matheus Martins", "Marlon Freitas"],
  "são paulo": ["Calleri", "Lucas Moura", "Ferreira", "André Silva"],
  "corinthians": ["Yuri Alberto", "Memphis Depay", "Rodrigo Garro", "Romero"],
  "internacional": ["Valencia", "Alan Patrick", "Wesley Ribeiro", "Bruno Henrique"],
  "grêmio": ["Cristaldo", "Soteldo", "Braithwaite", "Gustavo Nunes"],
  "vasco": ["Vegetti", "Coutinho", "GB", "Payet"],
  "athletico-pr": ["Canobbio", "Pablo", "Fernandinho", "Cuello"],
  "athletico paranaense": ["Canobbio", "Pablo", "Fernandinho", "Cuello"],
  "cruzeiro": ["Kaio Jorge", "Matheus Pereira", "Fabrício Bruno", "Cássio"],
  "bahia": ["Everaldo", "Cauly", "Thaciano", "Ademir"],
  "fortaleza": ["Moisés", "Lucero", "Marinho", "Tinga"],
  "ceará": ["Facundo Castro", "Saulo Mineiro", "Jean Irmer"],
  "santos": ["Neymar", "Guilherme", "Marcos Leonardo", "Otero"],
  "santos fc": ["Neymar", "Guilherme", "Marcos Leonardo", "Otero"],
  "coritiba": ["Messinho", "Ruy", "Adrián Martínez", "Sebastián Gómez"],
  "sport": ["Luciano Juba", "Gustavo Coutinho", "Paulinho Moccelin"],
  "juventude": ["Erick Farias", "Mandaca", "Gilberto"],
  "red bull bragantino": ["Thiago Borbas", "Eduardo Sasha", "Laquintana"],
  "bragantino": ["Thiago Borbas", "Eduardo Sasha", "Laquintana"],
  "vitória": ["Osvaldo", "Alerrandro", "Zé Hugo"],
  "goiás": ["Deyvid Biro", "Diego", "Auremir"],
  "america-mg": ["Juninho Valoura", "Mastriani"],
  "América mineiro": ["Juninho Valoura", "Mastriani"],
  "mirassol": ["Iury Castilho", "Negueba"],
  "cuiabá": ["Clayson", "Jonathan Cafú"],
};

const getTeamPlayers = (teamName: string): string[] => {
  const key = teamName.toLowerCase().trim();
  if (TEAM_PLAYERS[key]) return TEAM_PLAYERS[key];
  // busca parcial
  const match = Object.keys(TEAM_PLAYERS).find((k) => key.includes(k) || k.includes(key));
  return match ? TEAM_PLAYERS[match] : [];
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const buildPrompt = (game: {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
  venue: string | null;
  championship: { name: string };
}) => {
  const date = formatDate(new Date(game.kickoffAt));
  const time = formatTime(new Date(game.kickoffAt));
  const venue = game.venue ?? null;

  const homePlayers = getTeamPlayers(game.homeTeam);
  const awayPlayers = getTeamPlayers(game.awayTeam);

  const homePlayersLine = homePlayers.length > 0
    ? `Main players of ${game.homeTeam}: ${homePlayers.join(", ")} — show them wearing ${game.homeTeam} jersey`
    : `Show a recognizable player wearing ${game.homeTeam} official jersey`;

  const awayPlayersLine = awayPlayers.length > 0
    ? `Main players of ${game.awayTeam}: ${awayPlayers.join(", ")} — show them wearing ${game.awayTeam} jersey`
    : `Show a recognizable player wearing ${game.awayTeam} official jersey`;

  return `Create a professional, eye-catching Brazilian football match promotional poster in vertical portrait format (Instagram Story / WhatsApp).

EXACT match details — use these verbatim, do not replace with other names:
- Home team: ${game.homeTeam}
- Away team: ${game.awayTeam}
- Championship name (display exactly as written): "${game.championship.name}"
- Date: ${date}
- Time: às ${time}${venue ? `\n- Stadium: ${venue}` : ""}

Players to feature (use real likeness if known):
- ${homePlayersLine}
- ${awayPlayersLine}

Design:
- Dark cinematic background with dramatic stadium atmosphere, intense spotlights, smoke and particle effects
- Both official team crests/shields prominently at the top — one per side, large and detailed
- Feature the players listed above as large dramatic background figures, action-posed, each side wearing their club's jersey
- Ultra-bold central typography: "${game.homeTeam.toUpperCase()}" left · "X" center · "${game.awayTeam.toUpperCase()}" right — white with dramatic glow/shadow
- Styled info bar showing exactly: "${date} · às ${time}" with calendar and clock icons${venue ? `\n- Venue line showing exactly: "${venue}"` : ""}
- Top center: a gold trophy icon/illustration, and directly below it the championship name displayed exactly as "${game.championship.name}" in elegant styled text
- Bottom: very large handwritten/brush-style text "BOLÃO ABERTO" with lightning bolt decorations
- Below that: "★ CHAME OS AMIGOS E PARTICIPE! ★"
- Color scheme reflects both clubs' official colors
- Professional sports broadcast quality, high energy, Brazilian football aesthetic
- All text perfectly legible and correctly spelled in Portuguese`;
};

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada." },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { id } = await Promise.resolve(params);

  const game = await prisma.game.findUnique({
    where: { id },
    include: { championship: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const prompt = buildPrompt(game);

  const response = await client.images.generate({
    model: "gpt-image-1.5",
    prompt,
    n: 1,
    size: "1024x1536",
    quality: "medium",
  });

  const b64 = response.data[0]?.b64_json;
  if (!b64) {
    return NextResponse.json({ error: "Imagem não gerada." }, { status: 500 });
  }

  return NextResponse.json({ image: `data:image/png;base64,${b64}` });
};
