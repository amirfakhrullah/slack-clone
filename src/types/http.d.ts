declare module "http" {
  export interface IncomingMessage {
    token: string;
    sessionId: string;
  }
}
