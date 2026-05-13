import { BookOpen, Brain, Coffee, GitBranch, MessageCircle, Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createSoundscape } from "./soundscape";

interface SessionResponse {
  id: string;
  state: string;
  context: {
    repoName: string;
    gitStatus: string;
    recentCommits: string[];
    directorySummary: string[];
    testHints: string[];
  };
  plan: {
    learningGoal: string;
    currentActivity: string;
    shareLine?: string;
  };
}

const apiBase = "http://127.0.0.1:4317";

export function App() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wrapNote, setWrapNote] = useState("I stayed with one small thread today.");
  const [soundOn, setSoundOn] = useState(false);
  const [soundscape] = useState(() => createSoundscape());

  useEffect(() => {
    fetch(`${apiBase}/api/session/start`, { method: "POST" })
      .then((res) => res.json())
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  async function wrapUp() {
    await fetch(`${apiBase}/api/session/wrap-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: wrapNote }),
    });
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
        </article>

        <article className="panel companion">
          <Brain size={20} />
          <h2>Along's side</h2>
          <p className="state-pill">{session?.state ?? "arriving"}</p>
          <p>{session?.plan.learningGoal ?? "Arriving at the desk..."}</p>
          <p className="muted">{session?.plan.currentActivity ?? "Loading project memory."}</p>
        </article>

        <article className="panel wide">
          <BookOpen size={20} />
          <h2>Shared timeline</h2>
          <div className="timeline">
            {["arriving", "settling", "quiet_focus", "gentle_share", "rest", "wrap_up"].map((state) => (
              <span key={state} className={state === session?.state ? "active" : ""}>{state}</span>
            ))}
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
        </article>
      </section>
    </main>
  );
}
