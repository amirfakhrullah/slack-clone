import { createTRPCRouter } from "../../server/api/trpc";
import { teamsRouter } from "./routers/teams.router";
import { channelsRouter } from "./routers/channels.router";
import { chatsRouter } from "./routers/chats.router";
import { handshakeRouter } from "./procedures";

export const appRouter = createTRPCRouter({
  handshake: handshakeRouter,
  team: teamsRouter,
  channel: channelsRouter,
  chat: chatsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
