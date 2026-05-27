import { Sparkles } from "lucide-react";

const logoUrl = new URL("../vaja_logo.png", import.meta.url).href;

export default function App() {
  return (
    <main className="boot-screen">
      <img className="boot-logo" src={logoUrl} alt="VAJA logo" />
      <div>
        <p className="eyebrow">VAJA MVP</p>
        <h1>Japanese learning assistant</h1>
        <p className="boot-copy">
          React frontend shell is ready. The next task wires authenticated learner workflows.
        </p>
        <div className="boot-pill">
          <Sparkles size={18} />
          Blue and white study interface
        </div>
      </div>
    </main>
  );
}
