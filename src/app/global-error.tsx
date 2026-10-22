"use client";

/**
 * Last resort when the root layout itself fails. It replaces the whole
 * document, so it can't use the providers, Tailwind tokens or translation.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f1e7", color: "#3f4742", fontFamily: "system-ui, sans-serif", padding: 16 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ color: "#1b1f1c", fontSize: 24, margin: "0 0 8px" }}>HeriTech couldn&apos;t load</h1>
          <p style={{ margin: "0 0 20px", lineHeight: 1.5 }}>Please check your connection and try again.</p>
          <button
            onClick={reset}
            style={{ minHeight: 44, padding: "0 20px", border: 0, borderRadius: 10, background: "#1f3a2b", color: "#fff", fontSize: 15, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
