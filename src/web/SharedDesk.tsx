import { Brain, GitBranch, MessageCircle, PauseCircle, Search, XCircle } from "lucide-react";
import type { SharedDeskModel, SharedDeskThread } from "./shared-desk-model";

interface SessionForDesk {
  state: string;
  context: {
    repoName: string;
    gitStatus: string;
    recentCommits: string[];
    directorySummary: string[];
  };
  plan: {
    learningGoal: string;
    currentActivity: string;
  };
}

export type SharedDeskThreadAction =
  | { type: "not_now"; threadId: string }
  | { type: "hide"; threadId: string }
  | { type: "make_main"; threadId: string }
  | { type: "ask_why"; threadId: string };

interface SharedDeskProps {
  session: SessionForDesk | null;
  model: SharedDeskModel;
  onRunHeartbeat: () => void;
  onThreadAction: (action: SharedDeskThreadAction) => void;
}

const waitingCommitFallback = ["Recent activity will appear after Along reads the repo."];

function stateLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export function SharedDesk({ session, model, onRunHeartbeat, onThreadAction }: SharedDeskProps) {
  const recentCommits = session?.context.recentCommits.length
    ? session.context.recentCommits.slice(0, 3)
    : waitingCommitFallback;
  const repoName = session?.context.repoName || "Waiting for local session";
  const learningGoal = session?.plan.learningGoal || "Arriving at the desk...";
  const currentActivity = session?.plan.currentActivity || "Loading project memory.";
  const sideHeadline = model.mode === "active" ? "I am holding this with you." : "I am here quietly.";

  return (
    <section className="desk-shell" aria-label="Shared Desk">
      <div className="desk-context-grid">
        <article className="desk-context-panel">
          <GitBranch size={20} aria-hidden="true" />
          <p className="desk-label">Your side</p>
          <h2>{repoName}</h2>
          <pre>{session?.context.gitStatus || "No git changes detected."}</pre>
          <div className="activity-list">
            {recentCommits.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {session?.context.directorySummary.length ? (
            <div className="context-list" aria-label="Project context">
              {session.context.directorySummary.slice(0, 6).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
        </article>

        <article className="desk-context-panel desk-along-side">
          <Brain size={20} aria-hidden="true" />
          <p className="desk-label">Along's side</p>
          <h2>{sideHeadline}</h2>
          <p>{learningGoal}</p>
          <p className="muted">{currentActivity}</p>
        </article>
      </div>

      {model.mainThread ? (
        <MainThreadCard
          thread={model.mainThread}
          onRunHeartbeat={onRunHeartbeat}
          onThreadAction={onThreadAction}
        />
      ) : (
        <article className="main-thread-card quiet-state">
          <p className="desk-label">Quiet state</p>
          <h2>No thread needs to interrupt you right now.</h2>
          <p>{model.quietMessage}</p>
          <div className="desk-actions">
            <button type="button" onClick={onRunHeartbeat}>
              <Search size={16} aria-hidden="true" />
              Check gently
            </button>
          </div>
        </article>
      )}

      {model.watchThreads.length > 0 ? (
        <section className="watch-thread-grid" aria-label="Watch Threads">
          {model.watchThreads.map((thread) => (
            <article className="watch-thread-card" key={thread.id}>
              <div className="row-title">
                <h3>{thread.title}</h3>
                <span className="row-status">{stateLabel(thread.status)}</span>
              </div>
              <p>{thread.selectionReason}</p>
              <button type="button" onClick={() => onThreadAction({ type: "make_main", threadId: thread.id })}>
                Make this main
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function MainThreadCard({
  thread,
  onRunHeartbeat,
  onThreadAction,
}: {
  thread: SharedDeskThread;
  onRunHeartbeat: () => void;
  onThreadAction: (action: SharedDeskThreadAction) => void;
}) {
  return (
    <article className="main-thread-card">
      <p className="desk-label">Along's judgment</p>
      <h2>{thread.title}</h2>
      <p className="judgment-copy">{thread.currentJudgment}</p>

      <div className="why-now">
        <strong>Why now</strong>
        <p>{thread.selectionReason}</p>
      </div>

      {thread.delegation ? <DelegationSuggestion thread={thread} /> : null}

      <div className="desk-actions">
        <button type="button" onClick={() => onThreadAction({ type: "ask_why", threadId: thread.id })}>
          <MessageCircle size={16} aria-hidden="true" />
          Ask why
        </button>
        <button type="button" onClick={onRunHeartbeat}>
          <Search size={16} aria-hidden="true" />
          Check gently
        </button>
        <button type="button" onClick={() => onThreadAction({ type: "not_now", threadId: thread.id })}>
          <PauseCircle size={16} aria-hidden="true" />
          Not now
        </button>
        <button type="button" onClick={() => onThreadAction({ type: "hide", threadId: thread.id })}>
          <XCircle size={16} aria-hidden="true" />
          Hide
        </button>
      </div>
    </article>
  );
}

function DelegationSuggestion({ thread }: { thread: SharedDeskThread }) {
  const { delegation } = thread;
  if (!delegation) return null;

  return (
    <div className="delegation-suggestion">
      <p className="desk-label">Read-only conductor action</p>
      <p>I can keep this bounded as read-only analysis.</p>
      <dl>
        <div>
          <dt>Target</dt>
          <dd>{stateLabel(delegation.target)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{stateLabel(delegation.status)}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{delegation.scope.join(", ")}</dd>
        </div>
      </dl>
      {delegation.forbiddenActions?.length ? (
        <p className="muted">Will not: {delegation.forbiddenActions.slice(0, 3).join(" ")}</p>
      ) : null}
    </div>
  );
}
