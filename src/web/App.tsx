import { BookOpen, Brain, CheckCircle2, Coffee, GitBranch, MessageCircle, Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createSoundscape } from "./soundscape";

interface SessionResponse {
  id: string;
  state: string;
  lifecycleState?: string;
  recoveredReason?: string;
  context: {
    repoName: string;
    gitStatus: string;
    recentCommits: string[];
    directorySummary: string[];
    testHints: string[];
  };
  plan: {
    state: string;
    learningGoal: string;
    currentActivity: string;
    shareLine?: string;
  };
}

const apiBase = "http://127.0.0.1:4317";
const presenceStates = ["arriving", "settling", "quiet_focus", "gentle_share", "rest", "wrap_up"];
let sessionLoadPromise: Promise<SessionResponse | null> | null = null;

interface WrapUpResponse {
  journalPath: string;
  remembered: string;
  state: string;
  journalPreview?: string;
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return await response.json() as T;
}

async function loadCurrentOrStart(): Promise<SessionResponse | null> {
  const current = await readJson<SessionResponse | null>(`${apiBase}/api/session/current`);
  if (current) return current;
  return await readJson<SessionResponse>(`${apiBase}/api/session/start`, { method: "POST" });
}

function stateLabel(state: string): string {
  return state.replaceAll("_", " ");
}

export function App() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wrapNote, setWrapNote] = useState("I stayed with one small thread today.");
  const [wrapFeedback, setWrapFeedback] = useState<WrapUpResponse | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [soundscape] = useState(() => createSoundscape());

  useEffect(() => {
    let cancelled = false;
    sessionLoadPromise ??= loadCurrentOrStart();
    sessionLoadPromise
      .then((nextSession) => {
        if (!cancelled) setSession(nextSession);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });

    const interval = window.setInterval(() => {
      readJson<SessionResponse | null>(`${apiBase}/api/session/current`)
        .then((nextSession) => {
          if (!cancelled && nextSession) setSession(nextSession);
        })
        .catch(() => undefined);
    }, 5_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function wrapUp() {
    const result = await readJson<WrapUpResponse>(`${apiBase}/api/session/wrap-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: wrapNote }),
    });
    setWrapFeedback(result);
    setSession((current) => current ? { ...current, state: result.state, plan: { ...current.plan, state: result.state } } : current);
  }

  async function toggleSound() {
    if (soundOn) {
      soundscape.stop();
      setSoundOn(false);
    } else {
      await soundscape.start();
      setSoundOn(true);
    }
  }

  const activeStateIndex = Math.max(0, presenceStates.indexOf(session?.state ?? "arriving"));

  return (
    <main className="shell">
      <section className="shared-desk">
        <div>
          <p className="eyebrow">Along</p>
          <h1>A lo-fi coding companion that learns along with you.</h1>
          <p className="lead">
            You work on the project. Along quietly works on understanding it, keeps its own journal,
            and remembers the thread for next time.
          </p>
        </div>
        <button className="sound-button" onClick={toggleSound} aria-pressed={soundOn}>
          <Music2 size={18} />
          {soundOn ? "Sound on" : "Lo-fi sound"}
        </button>
      </section>

      <section className="grid">
        <article className="panel">
          <GitBranch size={20} />
          <h2>Your side</h2>
          <p className="muted">{session?.context.repoName ?? "Waiting for local session"}</p>
          <pre>{session?.context.gitStatus || "No git changes detected."}</pre>
          <div className="activity-list">
            {(session?.context.recentCommits ?? ["Recent activity will appear after Along reads the repo."]).slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="context-list" aria-label="Project context">
            {(session?.context.directorySummary ?? []).slice(0, 6).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>

        <article className="panel companion">
          <Brain size={20} />
          <h2>Along's side</h2>
          <p className="state-pill">{stateLabel(session?.state ?? "arriving")}</p>
          <p>{session?.plan.learningGoal ?? "Arriving at the desk..."}</p>
          <p className="muted">{session?.plan.currentActivity ?? "Loading project memory."}</p>
        </article>

        <article className="panel wide">
          <BookOpen size={20} />
          <h2>Shared timeline</h2>
          <div className="timeline">
            {presenceStates.map((state, index) => {
              const isActive = state === session?.state;
              const isComplete = index < activeStateIndex;
              return (
                <span
                  key={state}
                  className={isActive ? "active" : isComplete ? "complete" : ""}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete && <CheckCircle2 size={14} aria-hidden="true" />}
                  {stateLabel(state)}
                </span>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <MessageCircle size={20} />
          <h2>Gentle share</h2>
          <p>{session?.plan.shareLine ?? "Along will share only when it has a real reason."}</p>
        </article>

        <article className="panel">
          <Coffee size={20} />
          <h2>Wrap-up</h2>
          <textarea value={wrapNote} onChange={(event) => setWrapNote(event.target.value)} />
          <button onClick={wrapUp}>Write today's journal</button>
          {wrapFeedback && (
            <div className="wrap-feedback" aria-live="polite">
              <p><strong>What I remembered:</strong> {wrapFeedback.remembered}</p>
              {wrapFeedback.journalPreview && <pre>{wrapFeedback.journalPreview}</pre>}
              <code>{wrapFeedback.journalPath}</code>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
