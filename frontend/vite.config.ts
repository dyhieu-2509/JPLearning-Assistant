import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = "http://localhost:8080";

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function forwardedPort(host: string | undefined, proto: string): string {
  const explicitPort = host?.match(/:(\d+)$/)?.[1];
  if (explicitPort) {
    return explicitPort;
  }
  return proto === "https" ? "443" : "80";
}

const oauthProxy: ProxyOptions = {
  target: backendTarget,
  changeOrigin: false,
  secure: false,
  configure(proxy) {
    proxy.on("proxyReq", (proxyReq, req) => {
      const host = firstHeader(req.headers.host);
      const proto = firstHeader(req.headers["x-forwarded-proto"]) ?? "http";
      if (host) {
        proxyReq.setHeader("X-Forwarded-Host", host);
      }
      proxyReq.setHeader("X-Forwarded-Proto", proto);
      proxyReq.setHeader("X-Forwarded-Port", forwardedPort(host, proto));
    });
  }
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true
      },
      "/oauth2": oauthProxy,
      "/login/oauth2": oauthProxy
    }
  }
});
