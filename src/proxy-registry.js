import { log } from "./utils.js";

const isDockerHub = true;
const upstream = "https://registry-1.docker.io"

export async function handleRequest(request) {
  log(`请求方法：${request.method}`)
  log(`请求地址：${request.url}`)
  const url = new URL(request.url);

  const headers = request.header();
  const authorization = headers['authorization']
  log('请求头')
  log(headers)
  log(`请求头鉴权 TOKEN：` + authorization)

  headers.host = "registry-1.docker.io"
  if (url.pathname == "/v2/") {
    const authHeaders = new Headers();
    if (authorization) {
      authHeaders.set("authorization", authorization);
    }
    const resp = await fetch(upstream + "/v2/", {
      method: "GET",
      headers: authHeaders,
      redirect: "follow",
    });
    log("/v2/ 请求路径：" + upstream + "/v2/")
    log("/v2/ 路径鉴权响应：" + resp.status)
    if (resp.status === 401) {
      authHeaders.set(
        "Www-Authenticate",
        `Bearer realm="http://${url.host}/v2/auth",service="cloudflare-docker-proxy"`
      );
      return new Response(JSON.stringify({ message: "UNAUTHORIZED" }), {
        status: 401,
        headers: authHeaders,
      });
    } else {
      return resp;
    }
  }
  if (url.pathname == "/v2/auth") {
    const resp = await fetch(upstream + "/v2/", {
      method: "GET",
      redirect: "follow",
    });
    log("/v2/auth 请求路径：" + upstream + "/v2/")
    log("/v2/auth 路径鉴权响应：" + resp.status)
    if (resp.status !== 401) {
      return resp;
    }
    const authenticateStr = resp.headers.get("WWW-Authenticate");
    if (authenticateStr === null) {
      return resp;
    }
    const wwwAuthenticate = parseAuthenticate(authenticateStr);
    let scope = url.searchParams.get("scope");
    if (scope && isDockerHub) {
      let scopeParts = scope.split(":");
      if (scopeParts.length == 3 && !scopeParts[1].includes("/")) {
        scopeParts[1] = "library/" + scopeParts[1];
        scope = scopeParts.join(":");
      }
    }
    return await fetchToken(wwwAuthenticate, scope, authorization);
  }
  if (isDockerHub) {
    const pathParts = url.pathname.split("/");
    if (pathParts.length == 5) {
      pathParts.splice(2, 0, "library");
      const redirectUrl = new URL(url);
      redirectUrl.pathname = pathParts.join("/");
      return Response.redirect(redirectUrl, 301);
    }
  }
  const newUrl = new URL(upstream + url.pathname);
  log(`重定向请求地址：${newUrl}`)
  log(headers)

  const response = await fetch(newUrl, {
    method: request.method,
    headers,
    redirect: "follow",
  })
  return response;
}

function parseAuthenticate(authenticateStr) {
  const re = /(?<=\=")(?:\\.|[^"\\])*(?=")/g;
  const matches = authenticateStr.match(re);
  if (matches == null || matches.length < 2) {
    throw new Error(`invalid Www-Authenticate Header: ${authenticateStr}`);
  }
  return {
    realm: matches[0],
    service: matches[1],
  };
}

async function fetchToken(
  wwwAuthenticate,
  scope,
  authorization
) {
  const url = new URL(wwwAuthenticate.realm);
  if (wwwAuthenticate.service.length) {
    url.searchParams.set("service", wwwAuthenticate.service);
  }
  if (scope) {
    url.searchParams.set("scope", scope);
  }
  const headers = new Headers();
  if (authorization) {
    headers.set("Authorization", authorization);
  }
  return await fetch(url, { method: "GET", headers: headers });
}
