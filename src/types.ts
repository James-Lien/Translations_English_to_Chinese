export interface MessagePart {
  text: string;
}

export interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}

export interface TranslationResponse {
  text?: string;
  error?: string;
}
