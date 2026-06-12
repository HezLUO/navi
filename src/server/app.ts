import express from "express";
import cors from "cors";
import { z } from "zod";
import { getRuntimeDoctorReport } from "../core/doctor";
import { ReviewGate } from "../core/review-gate";
import { AlongRuntime } from "../core/runtime";
import { TraceStore } from "../core/trace-store";
import { heartbeatTriggers } from "../core/types";

export interface AppOptions {
  repoPath: string;
  homeDir?: string;
}

function isSafeSessionId(value: string): boolean {
  return value.length > 0
    && value !== "."
    && value !== ".."
    && value !== "current"
    && value !== "index"
    && !value.includes("/")
    && !value.includes("\\")
    && /^[A-Za-z0-9_-]+$/.test(value);
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
      const sessionId = z.string().refine(isSafeSessionId, "Invalid session id").parse(req.query.sessionId);
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

  app.get("/api/conductor/snapshot", async (_req, res, next) => {
    try {
      res.json(await runtime.conductorSnapshot());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/conductor/heartbeat", async (req, res, next) => {
    try {
      const parsed = z.object({ trigger: z.enum(heartbeatTriggers) }).parse(req.body);
      res.json(await runtime.conductorHeartbeat(parsed.trigger));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/conductor/delegation-result", async (req, res, next) => {
    try {
      const parsed = z.object({
        requestId: z.string().min(1),
        threadId: z.string().min(1),
        target: z.enum(["codex", "hermes", "local_subagent", "manual"]),
        status: z.enum(["completed", "failed", "cancelled"]),
        summary: z.string(),
        evidence: z.array(z.string()),
        risks: z.array(z.string()),
        recommendations: z.array(z.string()),
        confidence: z.enum(["low", "medium", "high"]),
        rawOutput: z.string().optional(),
        completedAt: z.string().datetime(),
      }).parse(req.body);
      res.json(await runtime.ingestDelegationResult(parsed));
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: message });
      return;
    }
    if (message.startsWith("Review item not found:")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  });

  return app;
}
