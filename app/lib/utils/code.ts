import { chunk } from "es-toolkit";

export const toSegmentedCode = (code: string) =>
  chunk(code.split(""), 4)
    .map((segment) => segment.join(""))
    .join("-");

export const toVerificationCode = (code: string) => code.replaceAll("-", "");
