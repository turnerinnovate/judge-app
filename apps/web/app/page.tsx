export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', lineHeight: 1.4 }}>
      <h1>INNOVATE AI JUDGE</h1>
      <p>Shared motion analysis, but two distinct products: AI Coaching and Tournament Judging.</p>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h2>Training Mode (AI Coach)</h2>
        <p>Improvement-first feedback, drills, and skill progression tracking. Never used for official tournament outcomes.</p>
        <ul>
          <li>Phase-level corrections and drill prescriptions</li>
          <li>Skill trend indicators across submissions</li>
          <li>Instructor-friendly coaching language</li>
        </ul>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h2>Tournament Judge Console (AI Assist)</h2>
        <p>Rubric-based AI shadow judging with confidence-gated recommendations and human-authoritative finalization.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <h3>AI Shadow Output</h3>
            <ul>
              <li>Weighted rubric category scores</li>
              <li>Deduction suggestions + rule references</li>
              <li>Confidence explanations by signal</li>
            </ul>
          </div>
          <div>
            <h3>Human Final Workflow</h3>
            <ul>
              <li>Judge override with rationale</li>
              <li>Panel finalization + outlier detection</li>
              <li>Immutable score provenance</li>
            </ul>
          </div>
          <div>
            <h3>Tournament Ops</h3>
            <ul>
              <li>Tie-break aware placement logic</li>
              <li>Leaderboard snapshot publication</li>
              <li>Audit-ready result records</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
