import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="vland">
      <div className="vland-content">
        <h1 className="vland-title">
          Ask the web.
          <br />
          Ask your documents.
        </h1>
        <p className="vland-sub">
          Answers with sources, from the internet or your own PDFs.
        </p>
        <Link className="vpub-button" to="/login">
          <span>Start chat</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
