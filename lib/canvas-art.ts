const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });

const AVATAR_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const drawCircleAvatar = async (
  ctx: CanvasRenderingContext2D,
  name: string,
  imageUrl: string | null | undefined,
  cx: number,
  cy: number,
  r: number
) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl);
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      return;
    } catch {
      // fall through to initial avatar
    }
  }

  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  ctx.fillStyle = color;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.round(r * 0.85)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.charAt(0).toUpperCase(), cx, cy + 1);
  ctx.restore();
};

// ─── Tabela de Pontos ──────────────────────────────────────────────────────

export type TabelaEntry = {
  name: string;
  imageUrl?: string | null;
  points: number;
  exactHits: number;
  resultHits: number;
};

export const generateTabelaImage = async (
  championshipName: string,
  entries: TabelaEntry[]
): Promise<string> => {
  const W = 600;
  const PAD = 28;
  const HEADER_H = 140;
  const COL_ROW_H = 34;
  const ROW_H = 64;
  const FOOTER_H = 64;
  const H = HEADER_H + COL_ROW_H + entries.length * ROW_H + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e293b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // header accent
  const hg = ctx.createLinearGradient(0, 0, W, HEADER_H);
  hg.addColorStop(0, "#064e3b");
  hg.addColorStop(1, "#0f172a");
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, HEADER_H);

  // trophy
  ctx.font = "46px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🏆", W / 2, 46);

  // championship name
  ctx.fillStyle = "#ecfdf5";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(championshipName, W / 2, 90);

  // subtitle
  ctx.fillStyle = "#6ee7b7";
  ctx.font = "13px Arial";
  ctx.fillText("TABELA DE PONTOS", W / 2, 118);

  // column headers row
  const colY = HEADER_H;
  ctx.fillStyle = "#1e3a5f";
  ctx.fillRect(0, colY, W, COL_ROW_H);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 11px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("JOGADOR", PAD + 62, colY + COL_ROW_H / 2);
  ctx.textAlign = "center";
  ctx.fillText("PTS", W - 120, colY + COL_ROW_H / 2);
  ctx.fillStyle = "#6ee7b7";
  ctx.fillText("EXATOS", W - 78, colY + COL_ROW_H / 2);
  ctx.fillStyle = "#fcd34d";
  ctx.fillText("RESULT", W - 36, colY + COL_ROW_H / 2);

  // rows
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const ry = HEADER_H + COL_ROW_H + i * ROW_H;
    const cy = ry + ROW_H / 2;

    // row bg
    if (i === 0) {
      const gold = ctx.createLinearGradient(0, ry, W, ry + ROW_H);
      gold.addColorStop(0, "rgba(251,191,36,0.14)");
      gold.addColorStop(1, "rgba(251,191,36,0.04)");
      ctx.fillStyle = gold;
    } else {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.1)";
    }
    ctx.fillRect(0, ry, W, ROW_H);

    // position circle
    const posColors = ["#f59e0b", "#94a3b8", "#b45309"];
    ctx.beginPath();
    ctx.arc(PAD + 16, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = i < 3 ? posColors[i] : "#334155";
    ctx.fill();
    ctx.fillStyle = i < 3 ? "#1e293b" : "#94a3b8";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), PAD + 16, cy);

    // crown for 1st
    if (i === 0) {
      ctx.font = "15px Arial";
      ctx.fillText("👑", PAD + 16, cy - 22);
    }

    // avatar
    await drawCircleAvatar(ctx, e.name, e.imageUrl, PAD + 52, cy, 22);

    // name
    ctx.fillStyle = i === 0 ? "#fbbf24" : "#f1f5f9";
    ctx.font = i === 0 ? "bold 17px Arial" : "16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(e.name, PAD + 82, cy);

    // points
    ctx.fillStyle = i === 0 ? "#fbbf24" : "#e2e8f0";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(e.points), W - 120, cy);

    // exact hits
    ctx.fillStyle = "#6ee7b7";
    ctx.font = "bold 16px Arial";
    ctx.fillText(String(e.exactHits), W - 78, cy);

    // result hits
    ctx.fillStyle = "#fcd34d";
    ctx.font = "bold 16px Arial";
    ctx.fillText(String(e.resultHits), W - 36, cy);

    // separator
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, ry + ROW_H);
    ctx.lineTo(W - PAD, ry + ROW_H);
    ctx.stroke();
  }

  // footer
  const fy = H - FOOTER_H;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, fy, W, FOOTER_H);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⚽  BOLÃO DA FAMÍLIA", W / 2, fy + FOOTER_H / 2);

  return canvas.toDataURL("image/png");
};

// ─── Resultado do Jogo ────────────────────────────────────────────────────

export type ResultadoPrediction = {
  playerName: string;
  playerImageUrl?: string | null;
  homeScore: number;
  awayScore: number;
  points: number;
};

export const generateResultadoImage = async (params: {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  roundLabel: string | null;
  kickoffAt: Date;
  championshipName: string;
  predictions: ResultadoPrediction[];
  homeClubIconUrl?: string | null;
  awayClubIconUrl?: string | null;
}): Promise<string> => {
  const W = 600;
  const PAD = 28;
  const HEADER_H = 90;
  const SCOREBOARD_H = 200;
  const PRED_HEADER_H = 40;
  const ROW_H = 60;
  const FOOTER_H = 64;
  const preds = [...params.predictions].sort((a, b) => b.points - a.points);
  const H = HEADER_H + SCOREBOARD_H + PRED_HEADER_H + preds.length * ROW_H + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e293b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // header
  const hg = ctx.createLinearGradient(0, 0, W, HEADER_H);
  hg.addColorStop(0, "#064e3b");
  hg.addColorStop(1, "#0f172a");
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, HEADER_H);

  ctx.font = "26px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🏆", W / 2 - 70, HEADER_H / 2);

  ctx.fillStyle = "#ecfdf5";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(params.championshipName, W / 2, HEADER_H / 2 - 10);

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "13px Arial";
  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  }).format(new Date(params.kickoffAt));
  ctx.fillText(
    `${params.roundLabel ?? "Jogo"} · ${dateStr}`,
    W / 2,
    HEADER_H / 2 + 14
  );

  // scoreboard area
  const sbY = HEADER_H;

  // home side
  await drawCircleAvatar(ctx, params.homeTeam, params.homeClubIconUrl, W / 2 - 170, sbY + 70, 44);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(params.homeTeam, W / 2 - 170, sbY + 130);

  // away side
  await drawCircleAvatar(ctx, params.awayTeam, params.awayClubIconUrl, W / 2 + 170, sbY + 70, 44);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(params.awayTeam, W / 2 + 170, sbY + 130);

  // score
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${params.homeScore}`, W / 2 - 44, sbY + 80);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 40px Arial";
  ctx.fillText("x", W / 2, sbY + 80);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px Arial";
  ctx.fillText(`${params.awayScore}`, W / 2 + 44, sbY + 80);

  // result badge
  const homeWon = params.homeScore > params.awayScore;
  const awayWon = params.awayScore > params.homeScore;
  const draw = params.homeScore === params.awayScore;
  const resultText = draw ? "EMPATE" : homeWon ? `Vitória ${params.homeTeam}` : `Vitória ${params.awayTeam}`;
  ctx.fillStyle = draw ? "#64748b" : "#10b981";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(resultText.toUpperCase(), W / 2, sbY + 155);

  // predictions header
  const phY = HEADER_H + SCOREBOARD_H;
  ctx.fillStyle = "#1e3a5f";
  ctx.fillRect(0, phY, W, PRED_HEADER_H);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("JOGADOR", PAD + 62, phY + PRED_HEADER_H / 2);
  ctx.textAlign = "center";
  ctx.fillText("PALPITE", W / 2, phY + PRED_HEADER_H / 2);
  ctx.fillText("PTS", W - PAD - 12, phY + PRED_HEADER_H / 2);

  // prediction rows
  const maxPts = preds[0]?.points ?? 0;

  for (let i = 0; i < preds.length; i++) {
    const p = preds[i];
    const ry = phY + PRED_HEADER_H + i * ROW_H;
    const cy = ry + ROW_H / 2;
    const isWinner = p.points > 0 && p.points === maxPts;
    const isExact = p.points === 3;
    const isResult = p.points === 1;

    // row bg
    if (isWinner) {
      const g = ctx.createLinearGradient(0, ry, W, ry + ROW_H);
      g.addColorStop(0, "rgba(251,191,36,0.13)");
      g.addColorStop(1, "rgba(251,191,36,0.03)");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.1)";
    }
    ctx.fillRect(0, ry, W, ROW_H);

    // crown
    if (isWinner) {
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👑", PAD + 14, cy);
    }

    // avatar
    await drawCircleAvatar(ctx, p.playerName, p.playerImageUrl, PAD + 50, cy, 22);

    // name
    ctx.fillStyle = isWinner ? "#fbbf24" : "#f1f5f9";
    ctx.font = isWinner ? "bold 17px Arial" : "16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(p.playerName, PAD + 80, cy);

    // prediction score
    const predColor = isExact ? "#6ee7b7" : isResult ? "#fcd34d" : "#64748b";
    ctx.fillStyle = predColor;
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${p.homeScore} x ${p.awayScore}`, W / 2, cy);

    // points badge
    const badgeX = W - PAD - 12;
    const badgeR = 20;
    ctx.beginPath();
    ctx.arc(badgeX, cy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = isExact ? "#065f46" : isResult ? "#78350f" : "#1e293b";
    ctx.fill();
    ctx.fillStyle = isExact ? "#6ee7b7" : isResult ? "#fcd34d" : "#64748b";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(p.points), badgeX, cy);

    // separator
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, ry + ROW_H);
    ctx.lineTo(W - PAD, ry + ROW_H);
    ctx.stroke();
  }

  // footer
  const fy = H - FOOTER_H;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, fy, W, FOOTER_H);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⚽  BOLÃO DA FAMÍLIA", W / 2, fy + FOOTER_H / 2);

  return canvas.toDataURL("image/png");
};
