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
