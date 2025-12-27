import { type AnyMessage, image, text } from "~/lib/clients/onebot/message";
import { toSegmentedFormat } from "~/lib/modules/auth/verification";

type TemplateBuilder<Args extends Record<string, string>> = (args: Args) => AnyMessage[];

export const buildAuthRequestTemplate: TemplateBuilder<{ code: string }> = ({ code }) => [
  text(`This is your verification code for Abyss Watcher: ${toSegmentedFormat(code)}, please use it within 2 minute.`),
];

export const buildSimpleNotificationtemplate: TemplateBuilder<{ avatarUrl: string; message: string }> = ({
  avatarUrl,
  message,
}) => [image(avatarUrl), text(message)];
