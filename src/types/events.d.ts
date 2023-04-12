interface MyEvents {
  addOneToOne: (data: Chat) => void;
  addToChannel: (data: Chat) => void;
  deleteInOneToOne: (data: Chat) => void;
  deleteInChannel: (data: Chat) => void;
}

declare module "events" {
  declare interface MyEventEmitter {
    on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
    off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
    once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
    emit<TEv extends keyof MyEvents>(
      event: TEv,
      ...args: Parameters<MyEvents[TEv]>
    ): boolean;
  }
}
