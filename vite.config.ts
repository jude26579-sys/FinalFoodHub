import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8084,
    strictPort: true,
    middlewareMode: false,
    proxy: {
      // IMPORTANT: More specific paths must come FIRST, then general paths
      
      // ===== MENU SERVICE (Port 9002) - SPECIFIC PATHS FIRST =====
      '/api/menu': {
        target: 'http://localhost:9002',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        ws: true,
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          console.log(`[Proxy] Menu Service: ${req.method} ${req.url}`);
          console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? 'PRESENT' : 'MISSING');
          // Preserve Authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1');
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          proxyReq.setHeader('X-Forwarded-Host', 'localhost:8084');
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          console.log(`[Proxy] Menu Service Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy] Menu Service Error:`, err);
        },
      },
      
      // ===== CART SERVICE (Port 8096) =====
      '/api/cart': {
        target: 'http://localhost:8096',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        ws: true,
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          console.log(`[Proxy] Cart Service: ${req.method} ${req.url}`);
          console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? 'PRESENT' : 'MISSING');
          // Preserve Authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1');
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          proxyReq.setHeader('X-Forwarded-Host', 'localhost:8084');
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          console.log(`[Proxy] Cart Service Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy] Cart Service Error:`, err);
        },
      },
      
      // ===== PLACING ORDER SERVICE (Port 8083) - Orders Endpoint =====
      '/api/orders': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        ws: true,
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          console.log(`[Proxy] Order Service: ${req.method} ${req.url}`);
          console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? 'PRESENT' : 'MISSING');
          // Preserve Authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1');
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          proxyReq.setHeader('X-Forwarded-Host', 'localhost:8084');
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          console.log(`[Proxy] Order Service Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy] Order Service Error:`, err);
        },
      },
      
      // ===== PAYMENT SERVICE (Port 8282) - Payment Endpoint =====
      '/api/payment': {
        target: 'http://localhost:8282',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        ws: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          console.log(`[Proxy] Payment Service: ${req.method} ${req.url}`);
          console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? 'PRESENT' : 'MISSING');
          // Preserve Authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1');
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          proxyReq.setHeader('X-Forwarded-Host', 'localhost:8084');
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          console.log(`[Proxy] Payment Service Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy] Payment Service Error:`, err);
        },
      },
      
      // ===== RESTAURANT SERVICE (Port 8182) =====
      '/api/restaurants': {
        target: 'http://localhost:8182',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
        secure: false,
        followRedirects: true,
        ws: true,
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          console.log(`[Proxy] Restaurant Service: ${req.method} ${req.url}`);
          console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? 'PRESENT' : 'MISSING');
          // Preserve Authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1');
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          proxyReq.setHeader('X-Forwarded-Host', 'localhost:8084');
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          console.log(`[Proxy] Restaurant Service Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy] Restaurant Service Error:`, err);
        },
      },
      
      // ===== REPORTING SERVICE (Port 8091) =====
      '/api/report': {
        target: 'http://localhost:8091',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        ws: true,
        onProxyReq: (proxyReq: any, req: any, res: any) => {
          console.log(`[Proxy] Reporting Service: ${req.method} ${req.url}`);
          console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? 'PRESENT' : 'MISSING');
          // Preserve Authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
          proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1');
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          proxyReq.setHeader('X-Forwarded-Host', 'localhost:8084');
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          console.log(`[Proxy] Reporting Service Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy] Reporting Service Error:`, err);
        },
      },

      "/api/feedback": {
  target: "http://localhost:8089",
  changeOrigin: true,
  secure: false,
  followRedirects: true,
  ws: true,
  onProxyReq: (proxyReq: any, req: any, res: any) => {
    console.log(`[Proxy] Feedback Service: ${req.method} ${req.url}`);
    console.log(`[Proxy] Authorization Header:`, req.headers.authorization ? "PRESENT" : "MISSING");
    if (req.headers.authorization) {
      proxyReq.setHeader("Authorization", req.headers.authorization);
    }
    proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress || "127.0.0.1");
    proxyReq.setHeader("X-Forwarded-Proto", "http");
    proxyReq.setHeader("X-Forwarded-Host", "localhost:8084");
  },
  onProxyRes: (proxyRes: any, req: any, res: any) => {
    console.log(`[Proxy] Feedback Service Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err: any, req: any, res: any) => {
    console.error("[Proxy] Feedback Service Error:", err);
  },
},
      
      // ===== CUSTOMER/VENDOR/ADMIN ENDPOINTS (Port 8080) =====
      '/api/customer': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      '/api/vendor': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      '/api/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
