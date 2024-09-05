import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { handleRequest } from "./proxy-registry";

const app = new Hono();

app.get("/", (c) => {
  return handleRequest(c.req);
});

const port = 3000;

serve({
  fetch: app.fetch,
  port,
});
