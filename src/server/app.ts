import express from "express";
import cors from "cors";
import { z } from "zod";
import { getRuntimeDoctorReport } from "../core/doctor";
import { ReviewGate } from "../core/review-gate";
import { AlongRuntime } from "../core/runtime";
import { TraceStore } from "../core/trace-store";

export interface AppOptions {
  repoPath: string;
  homeDir?: string;
}

export function createApp(options: AppOptions) {
  const app = express();
  const runtime = new AlongRuntime(options);
  const reviewGate = new ReviewGate(options.repoPath);
  const traceStore = new TraceStore(options.repoPath);

  app.use(cors({ origin: true }));
  app.use(express.json());

  app.post("/api/session/start", async (_req, res, next) => {
    try {
      res.json(await runtime.start());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/session/current", async (_req, res, next) => {
    try {
      res.json((await runtime.current()) ?? null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/session/pause", async (_req, res, next) => {
    try {
      res.json(await runtime.pause());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/session/wrap-up", async (req, res, next) => {
    try {
      const parsed = z.object({ note: z.string().min(1) }).parse(req.body);
      res.json(await runtime.wrapUp(parsed.note));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/runtime/doctor", async (_req, res, next) => {
    try {
      res.json(await getRuntimeDoctorReport(options.repoPath));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/runtime/traces", async (req, res, next) => {
    try {
      const sessionId = z.string().min(1).parse(req.query.sessionId);
      res.json(await traceStore.readTraces(sessionId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/review/inbox", async (_req, res, next) => {
    try {
      res.json(await reviewGate.readInbox());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/review/items", async (_req, res, next) => {
    try {
      res.json(await reviewGate.readInbox());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/items/:id/decision", async (req, res, next) => {
    try {
      const parsed = z.object({
        decision: z.enum(["accepted", "accept", "rejected", "reject", "edited", "edit"]),
        proposedChange: z.string().min(1).optional(),
      }).parse(req.body);

      if (parsed.decision === "accepted" || parsed.decision === "accept") {
        res.json(await reviewGate.accept(req.params.id));
        return;
      }

      if (parsed.decision === "rejected" || parsed.decision === "reject") {
        res.json(await reviewGate.reject(req.params.id));
        return;
      }

      const proposedChange = z.string().min(1).parse(parsed.proposedChange);
      res.json(await reviewGate.edit(req.params.id, proposedChange));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/:id/accept", async (req, res, next) => {
    try {
      res.json(await reviewGate.accept(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/:id/reject", async (req, res, next) => {
    try {
      res.json(await reviewGate.reject(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/:id/edit", async (req, res, next) => {
    try {
      const parsed = z.object({ proposedChange: z.string().min(1) }).parse(req.body);
      res.json(await reviewGate.edit(req.params.id, parsed.proposedChange));
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  });

  return app;
}
