export interface MessagePart {
  text: string;
}

export interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
  original?: string; // original English source for model messages
}

export interface TranslationResponse {
  text?: string;
  original?: string;
  error?: string;
}
