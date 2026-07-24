import LeadForm from "./LeadForm";

export default function HomePage() {
  return (
    <main className="container">
      <span className="eyebrow">LeadDesk Mini</span>
      <h1>Tell us about your project. We&apos;ll take it from here.</h1>
      <p className="subhead">
        A tiny lead-capture tool — built to show a complete loop: public
        form, real database, and a protected admin view for triaging
        submissions. Fill it out below to see it work end to end.
      </p>

      <div className="card">
        <LeadForm />
      </div>

      <p className="footer-credit">
        Built for{" "}
        <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">
          Digital Heroes Training Task
        </a>
      </p>
    </main>
  );
}
