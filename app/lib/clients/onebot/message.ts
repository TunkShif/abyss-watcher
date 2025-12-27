export type AnyMessage = TextMessage | ImageMessage;

export interface TextMessage {
  type: "text";
  data: {
    text: string;
  };
}

export interface ImageMessage {
  type: "image";
  data: {
    file: string;
  };
}

export const text = (text: string): TextMessage => ({ type: "text", data: { text } });
export const image = (url: string): ImageMessage => ({ type: "image", data: { file: url } });
