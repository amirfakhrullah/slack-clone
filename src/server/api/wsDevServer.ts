import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { Server } from "ws";
import { appRouter } from "./root";
import { createTRPCContext } from "./trpc";

const wss = new Server({
  port: 3001,
  verifyClient: (info, cb) => {
    const token = info.req.headers["authorization"];
    const sessionId = info.req.headers["session-id"];

    info.req.token = token;
    info.req.sessionId = typeof sessionId === "string" ? sessionId : undefined;
    cb(true);
  },
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createTRPCContext,
});

wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});
console.log("✅ WebSocket Server listening on ws://localhost:3001");
process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
