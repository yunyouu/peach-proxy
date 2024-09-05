import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { handleRequest } from "./proxy-registry.js";

import { log } from "./utils.js";


const app = new Hono();

app.all("/*", (c) => {
  return handleRequest(c.req);
});

const port = 3000;

serve({
  fetch: app.fetch,
  port,
});


log("当前代理服务已启动，端口：" + port)

