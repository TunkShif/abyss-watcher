import { createCanvas, loadImage } from "canvas";
import { createLogger } from "~/lib/logging";
import { FONTS, roundedRect } from "~/lib/modules/render/templates/common";

const logger = createLogger("renderer.game-card");

// Size
const width = 500;
const height = 150;

// Colors
const bgColor = "#16171d"; // Very dark background
const greenAccent = "#8cb63d"; // Steam Playing Green
const textColor = "#ffffff";

export interface GameCardProps {
  user: string;
  game: string;
  avatar: string;
}

export const generateGameCardData = async ({ user, game, avatar }: GameCardProps): Promise<Buffer> => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw Background
  // Clear with transparent if we want transparency outside rounded corners?
  // Usually cards are just rects. But let's make the card itself rounded.
  // If we want a transparent background png but with a rounded card:
  ctx.clearRect(0, 0, width, height);

  // Card background
  ctx.fillStyle = bgColor;
  // Let's leave some margin/padding or just fill.
  // If we fill the whole canvas, the user can just handle the file.
  // But let's make it nice with rounded corners for the card itself.
  roundedRect(ctx, 0, 0, width, height, 12);
  ctx.fill();

  // Game Art
  const imgSize = 110;
  const padding = 20;

  try {
    logger.info({ avatar }, "loading user avatar image");
    const img = await loadImage(avatar);

    const imgX = padding;
    const imgY = padding;

    ctx.save();
    roundedRect(ctx, imgX, imgY, imgSize, imgSize, 8);
    ctx.clip();

    // Draw image covering the square
    const aspect = img.width / img.height;
    let drawW: number, drawH: number, drawX: number, drawY: number;
    if (aspect > 1) {
      // Wider than tall
      drawH = imgSize;
      drawW = imgSize * aspect;
      drawX = imgX - (drawW - imgSize) / 2;
      drawY = imgY;
    } else {
      // Taller than wide
      drawW = imgSize;
      drawH = imgSize / aspect;
      drawX = imgX;
      drawY = imgY - (drawH - imgSize) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } catch (err) {
    logger.error({ err }, "error loading user avatar image");
    // Fallback rect
    ctx.fillStyle = "#333";
    ctx.fillRect(padding, padding, imgSize, imgSize);
  }

  // Vertical Bar
  const barX = padding + imgSize + 20;
  const barY = padding + 5;
  const barHeight = imgSize - 10;

  ctx.fillStyle = greenAccent;
  ctx.fillRect(barX, barY, 4, barHeight);

  // Text
  const textX = barX + 24;
  ctx.textBaseline = "top";

  // Name
  ctx.fillStyle = textColor;
  ctx.font = `bold 28px ${FONTS}`;
  ctx.fillText(user, textX, padding + 2);

  // Status
  ctx.fillStyle = greenAccent;
  ctx.font = `22px ${FONTS}`;
  ctx.fillText("正在玩", textX, padding + 40);

  // Game Name
  ctx.font = `22px ${FONTS}`;
  ctx.fillText(game, textX, padding + 75);

  return canvas.toBuffer("image/png");
};
