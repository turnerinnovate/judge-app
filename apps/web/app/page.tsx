export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', lineHeight: 1.4 }}>
      <h1>INNOVATE AI COACH</h1>
      <p>AI-powered martial arts training platform for model-vs-student comparison and skill progression.</p>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h2>Training Flow</h2>
        <ol>
          <li>Instructor uploads a model performance.</li>
          <li>Student uploads a practice attempt for the same template.</li>
          <li>Analysis service segments phases and aligns motions.</li>
          <li>AI Coach returns scoring, timestamped corrections, and drills.</li>
          <li>Instructor reviews and tracks progression over time.</li>
        </ol>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h2>What you get</h2>
        <ul>
          <li>Overall score + weighted category scores</li>
          <li>Phase-by-phase coaching notes with confidence</li>
          <li>Technique mistakes and drill recommendations</li>
          <li>Progress trends across attempts</li>
          <li>Video quality warnings</li>
        </ul>
      </section>
    </main>
  );
}
