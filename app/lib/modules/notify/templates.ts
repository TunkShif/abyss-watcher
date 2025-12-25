import type { AnyMessage } from "~/lib/clients/onebot/message";
import { toSegmentedCode } from "~/lib/utils/code";

type TemplateBuilder<Args extends Record<string, string>> = (args: Args) => AnyMessage[];

export const buildAuthRequestTemplate: TemplateBuilder<{ code: string }> = ({ code }) => [
  {
    type: "text",
    data: {
      text: `This is your verification code for Abyss Watcher: ${toSegmentedCode(code)}, please use it within 2 minute.`,
    },
  },
];

export const buildSimpleNotificationtemplate: TemplateBuilder<{ avatarUrl: string; text: string }> = ({
  avatarUrl,
  text,
}) => [
  { type: "image", data: { file: avatarUrl } },
  { type: "text", data: { text } },
];
