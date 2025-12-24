export type AnyMessage = TextMessage;

export interface TextMessage {
  type: "text";
  data: {
    text: string;
  };
}
