import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "dotenv/config";

const app = express();

// CORS — allow Capacitor native WebViews (iOS: capacitor://localhost, Android: https://localhost)
// plus production web origin and local dev origins. Credentials enabled for future session use.
const ALLOWED_ORIGINS = new Set<string>([
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
  "https://celiopromo.it",
  "https://www.celiopromo.it",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
  }
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// إعدادات البودي
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// لوج بسيط لطلبات /api + التقاط body لـ res.json
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          // تجاهل أي خطأ في stringify
        }
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // تسجيل الراوتس — يُفترض أن يُعيد كائن Server (HTTP/HTTPS)
  const server = await registerRoutes(app);

  // هندلر للأخطاء على مستوى الإكسبريس
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    res.status(status).json({ message });
    // أرمي الخطأ بعد الرد ليسجله الراصد العام (optional)
    throw err;
  });

  // في التطوير فعّل Vite بعد بقية الراوتس، وفي الإنتاج قدّم الملفات الستاتيكية
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // الإعدادات: المنفذ والعنوان
  // ملاحظة: البورت الافتراضي 5000 بناءً على تعليقك السابق
  const port = Number(process.env.PORT ?? 5000);

  // على ويندوز نستخدم 127.0.0.1 افتراضيًا لتجنّب ENOTSUP مع 0.0.0.0
  const isWin = process.platform === "win32";
  const host = process.env.HOST ?? (isWin ? "127.0.0.1" : "0.0.0.0");

  // استمع بطريقة متوافقة مع ويندوز (بدون reusePort)
  server.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });

  // لو حاب تُفعّل reusePort على لينكس مستقبلًا:
  // if (!isWin) {
  //   server.listen({ port, host, /* reusePort: true */ }, () => {
  //     log(`serving on http://${host}:${port}`);
  //   });
  // }
})().catch((e) => {
  // كاتش لأي خطأ من الـ IIFE
  console.error(e);
  process.exit(1);
});
