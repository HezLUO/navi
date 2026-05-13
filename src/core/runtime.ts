import os from "node:os";
import path from "node:path";
import type { AlongSession, CuriosityItem, GraphEdge, GraphNode, JournalEntry } from "./types";
import { inspectProject } from "./project-adapter";
import { MemoryStore } from "./memory-store";
import { ScriptedCompanionProvider, type CompanionProvider } from "./model-provider";

export interface RuntimeOptions {
  repoPath: string;
  homeDir?: string;
  provider?: CompanionProvider;
}

export interface WrapUpResult {
  journalPath: string;
  remembered: string;
}

export class AlongRuntime {
  private session?: AlongSession;
  private readonly memory: MemoryStore;
  private readonly provider: CompanionProvider;

  constructor(private readonly options: RuntimeOptions) {
    this.memory = new MemoryStore(options.repoPath, options.homeDir ?? os.homedir());
    this.provider = options.provider ?? new ScriptedCompanionProvider();
  }

  async start(): Promise<AlongSession> {
    await this.memory.ensureInitialized();
    const context = await inspectProject(this.options.repoPath);
    const curiosities = await this.memory.readCuriosities();
    const selected = curiosities.find((item) => item.status === "open") ?? this.createInitialCuriosity(context.repoName);
    if (!curiosities.some((item) => item.id === selected.id)) {
      await this.memory.writeCuriosities([selected, ...curiosities]);
    }

    const providerPlan = await this.provider.createLearningPlan({
      repoName: context.repoName,
      openCuriosity: selected.question,
      readmeHint: context.readme?.slice(0, 120),
    });

    const sessionId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
    const session: AlongSession = {
      id: sessionId,
      repoPath: this.options.repoPath,
      startedAt: new Date().toISOString(),
      state: "settling",
      context,
      plan: {
        state: "settling",
        sessionId,
        learningGoal: providerPlan.learningGoal,
        currentActivity: providerPlan.currentActivity,
        selectedCuriosity: selected,
        shareLine: providerPlan.shareLine,
      },
    };

    this.session = session;
    await this.memory.writeSession(sessionId, session);
    await this.writeStartGraph(session, selected);
    return session;
  }

  async current(): Promise<AlongSession | undefined> {
    return this.session;
  }

  async wrapUp(note: string): Promise<WrapUpResult> {
    if (!this.session) throw new Error("Cannot wrap up before starting a session.");
    const date = new Date().toISOString().slice(0, 10);
    const entry: JournalEntry = {
      sessionId: this.session.id,
      date,
      triedToUnderstand: this.session.plan.learningGoal,
      lookedAt: this.session.context.directorySummary.slice(0, 6),
      nowBelieves: [note],
      stillUnsure: [this.session.plan.selectedCuriosity?.question ?? "what to inspect next"],
      nextTime: this.session.plan.selectedCuriosity?.nextProbe ?? "continue from the current project summary",
      noticedAboutSession: "I stayed with one small thread instead of expanding into a large plan.",
    };
    const journalPath = await this.memory.writeJournal(entry);
    this.session.state = "wrap_up";
    await this.memory.writeSession(this.session.id, this.session);
    return { journalPath, remembered: note };
  }

  private createInitialCuriosity(repoName: string): CuriosityItem {
    return {
      id: `curiosity-${Date.now()}`,
      question: `What is the smallest useful entry point in ${repoName}?`,
      whyItMatters: "Along needs one small thread to understand before expanding.",
      nextProbe: "Read the README and manifest files, then inspect the top-level source folders.",
      status: "open",
      relatedProjectArea: "project-entry",
      createdFromSession: "initial",
    };
  }

  private async writeStartGraph(session: AlongSession, curiosity: CuriosityItem): Promise<void> {
    const createdAt = new Date().toISOString();
    const nodes: GraphNode[] = [
      { id: `project:${path.basename(session.repoPath)}`, type: "project", label: path.basename(session.repoPath), properties: { path: session.repoPath }, createdAt },
      { id: `session:${session.id}`, type: "session", label: session.id, properties: { repoPath: session.repoPath }, createdAt },
      { id: curiosity.id, type: "curiosity", label: curiosity.question, properties: { status: curiosity.status }, createdAt },
    ];
    const edges: GraphEdge[] = [
      { id: `edge:${session.id}:curiosity`, from: `session:${session.id}`, to: curiosity.id, type: "session_produced_curiosity", createdAt },
    ];
    await this.memory.projectGraph.addMany(nodes, edges);
  }
}
