import { type GameCardProps, generateGameCardData } from "~/lib/modules/render/templates/game-card";

export interface Renderer {
  renderGameCard(props: GameCardProps): Promise<string>;
}

export const Renderer: Renderer = {
  async renderGameCard(props: GameCardProps) {
    const buffer = await generateGameCardData(props);
    return base64encoding(buffer);
  },
};

const base64encoding = (buffer: Buffer) => `base64://${buffer.toString("base64")}`;
