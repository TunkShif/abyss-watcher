import type { AnyMessage } from "~/lib/modules/onebot/message";

type TemplateBuilder<Args extends Record<string, string>> = (args: Args) => AnyMessage[];

export const buildAuthRequestTemplate: TemplateBuilder<{ code: string }> = ({ code }) => [
  {
    type: "text",
    data: { text: `This is your auth token for Abyss Watcher: ${code}, please use it within 2 minute.` },
  },
];
