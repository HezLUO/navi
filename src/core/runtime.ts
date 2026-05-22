import os from "node:os";
import path from "node:path";
import type { AlongSession, CuriosityItem, GraphEdge, GraphNode, JournalEntry, PresenceState } from "./types";
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
  state: PresenceState;
  journalPreview: string;
}

const rhythmSteps: Array<{ state: PresenceState; maxElapsedMs: number }> = [
  { state: "arriving", maxElapsedMs: 3_000 },
  { state: "settling", maxElapsedMs: 12_000 },
  { state: "quiet_focus", maxElapsedMs: 28_000 },
  { state: "gentle_share", maxElapsedMs: 44_000 },
  { state: "rest", maxElapsedMs: Number.POSITIVE_INFINITY },
];

export function stateForElapsed(elapsedMs: number): PresenceState {
  return rhythmSteps.find((step) => elapsedMs < step.maxElapsedMs)?.state ?? "rest";
}

export function formatLocalJournalDate(date = new Date(), timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    const localYear = date.getFullYear();
    const localMonth = String(date.getMonth() + 1).padStart(2, "0");
    const localDay = String(date.getDate()).padStart(2, "0");
    return `${localYear}-${localMonth}-${localDay}`;
  }
  return `${year}-${month}-${day}`;
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
      state: "arriving",
      context,
      plan: {
        state: "arriving",
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
    await this.refreshPresenceState();
    return this.session;
  }

  async wrapUp(note: string): Promise<WrapUpResult> {
    if (!this.session) throw new Error("Cannot wrap up before starting a session.");
    const date = formatLocalJournalDate();
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
    this.session.plan.state = "wrap_up";
    await this.memory.writeSession(this.session.id, this.session);
    return {
      journalPath,
      remembered: note,
      state: "wrap_up",
      journalPreview: this.previewJournal(entry),
    };
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

  private async refreshPresenceState(): Promise<void> {
    if (!this.session || this.session.state === "wrap_up") return;
    const elapsedMs = Date.now() - Date.parse(this.session.startedAt);
    const nextState = stateForElapsed(Number.isFinite(elapsedMs) ? elapsedMs : 0);
    if (nextState === this.session.state) return;
    this.session.state = nextState;
    this.session.plan.state = nextState;
    await this.memory.writeSession(this.session.id, this.session);
  }

  private previewJournal(entry: JournalEntry): string {
    return [
      `I remembered: ${entry.nowBelieves[0]}`,
      `I looked at: ${entry.lookedAt.slice(0, 3).join(", ") || "the project shape"}.`,
      `Next time: ${entry.nextTime}`,
    ].join("\n");
  }
}
