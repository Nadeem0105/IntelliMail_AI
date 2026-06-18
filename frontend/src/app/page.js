"use client";

import { useState, useEffect } from "react";

const TEMPLATES = [
  {
    name: "🚨 Phishing Scam",
    text: "URGENT: Your bank account has been suspended due to suspicious activity. Click this link http://secure-verify-login-3891.com to log in and verify your identity within 24 hours to avoid permanent suspension."
  },
  {
    name: "📅 High Priority Work",
    text: "Hi Team,\n\nWe need to sync urgently today at 4:30 PM regarding the production database connection leaks. Several client sessions are dropping. Please review the server logs beforehand.\n\nThanks,\nEngineering Lead"
  },
  {
    name: "📰 Low Priority Newsletter",
    text: "Hello Developer,\n\nHere is your monthly roundup of tech news! Learn about Next.js 15 features, React Compiler advancements, and new performance best practices. No action is required, happy reading!\n\nBest,\nTech Digest Team"
  },
  {
    name: "🎁 Sweepstakes Spam",
    text: "CONGRATULATIONS! You have been selected as the grand prize winner of a brand new iPad Pro. Click here to claim your reward now! Limited time offer, only 5 spots remaining."
  }
];

export default function Home() {
  const [emailText, setEmailText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch (err) {
      setBackendStatus("offline");
    }
  };

  // Load theme and history from localStorage on mount
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem("intellimail-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Defer state updates to avoid synchronous cascading renders in the effect body
    setTimeout(() => {
      setTheme(savedTheme);

      // History setup
      const savedHistory = localStorage.getItem("intellimail-history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse history from localStorage", e);
        }
      }

      // Check backend connection
      checkBackendHealth();
    }, 0);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("intellimail-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const selectTemplate = (text) => {
    setEmailText(text);
    setError(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const textToAnalyze = emailText.trim();
    if (!textToAnalyze) {
      setError("Please paste or write an email to analyze first.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textToAnalyze })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: textToAnalyze,
        ml_classification: data.ml_classification,
        llm_classification: data.llm_classification,
        final_priority: data.final_priority,
        reasoning: data.reasoning
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)]; // limit to 20 items
      setHistory(updatedHistory);
      localStorage.setItem("intellimail-history", JSON.stringify(updatedHistory));
      setBackendStatus("online");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not connect to the API. Please make sure both the backend server and the Next.js server are active, and the GEMINI_API_KEY is configured in your backend environment.");
      setBackendStatus("offline");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("intellimail-history");
  };

  const loadHistoryItem = (item) => {
    setEmailText(item.text);
    setResult({
      text: item.text,
      ml_classification: item.ml_classification,
      llm_classification: item.llm_classification,
      final_priority: item.final_priority,
      reasoning: item.reasoning
    });
    setError(null);
  };

  const downloadReport = () => {
    if (!result) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(result, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `intellimail_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="container">
      <header className="brutal-header">
        <div className="header-top">
          <div>
            <h1>INTELLIMAIL AI</h1>
            <p>Spam & Priority Email Classifier</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="status-indicator">
              <span className={`status-dot ${backendStatus}`}></span>
              <span>API: {backendStatus.toUpperCase()}</span>
            </div>
            <button onClick={toggleTheme} className="theme-btn">
              {theme === "light" ? "🌙 DARK MODE" : "☀️ LIGHT MODE"}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Left column: Input and Analysis */}
        <div>
          <div className="brutal-card">
            <label htmlFor="email-text" className="brutal-label">
              Email Content
            </label>
            <textarea
              id="email-text"
              className="brutal-input"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste email text here to run hybrid ML/LLM analysis..."
            />

            <h4 style={{ marginBottom: "0.5rem", fontWeight: "700", textTransform: "uppercase", fontSize: "0.9rem" }}>
              Quick Templates:
            </h4>
            <div className="template-container">
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => selectTemplate(tpl.text)}
                  className="template-btn"
                  type="button"
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              className="brutal-btn"
              disabled={isLoading}
            >
              {isLoading ? "ANALYZING..." : "ANALYZE EMAIL ✨"}
            </button>
          </div>

          {error && (
            <div className="brutal-card" style={{ backgroundColor: "var(--accent-red)", color: "#ffffff", fontWeight: "700" }}>
              <h3>ERROR OCCURRED</h3>
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="brutal-loading">
              <div className="marquee">
                <span>PROCESSING EMAIL... RUNNING NAIVE BAYES... INITIATING GEMINI 2.5 FLASH DEEP CLASSIFICATION...</span>
              </div>
            </div>
          )}

          {result && (
            <div className="brutal-card" style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "1.5rem" }}>
                Analysis Results
              </h2>

              <div className="results-grid">
                <div className="brutal-card class-box" style={{ margin: 0 }}>
                  <h3>CLASSIFICATION</h3>
                  <div>
                    <span
                      className={`badge ${
                        result.llm_classification === "SPAM" ? "badge-spam" : "badge-not-spam"
                      }`}
                    >
                      {result.llm_classification === "SPAM" ? "SPAM" : "NOT SPAM"}
                    </span>
                  </div>
                </div>

                <div className="brutal-card prio-box" style={{ margin: 0 }}>
                  <h3>PRIORITY LEVEL</h3>
                  <div>
                    <span
                      className={`badge ${
                        result.final_priority === "HIGH"
                          ? "badge-high"
                          : result.final_priority === "MEDIUM"
                          ? "badge-medium"
                          : "badge-low"
                      }`}
                    >
                      {result.final_priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="brutal-card" style={{ margin: "0 0 1.5rem 0", backgroundColor: "var(--card-bg)" }}>
                <h3>AI REASONING</h3>
                <p style={{ marginTop: "0.5rem" }}>{result.reasoning}</p>
              </div>

              <div className="comparison-container">
                <h3>Decision Matrix</h3>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Engine</th>
                      <th>Method</th>
                      <th>Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Phase 1 Engine</td>
                      <td>Naive Bayes (Offline vocab matching)</td>
                      <td>
                        <span
                          style={{
                            fontWeight: "700",
                            color: result.ml_classification === "SPAM" ? "var(--accent-red)" : "var(--accent-green)",
                          }}
                        >
                          {result.ml_classification}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Phase 2 Engine</td>
                      <td>Gemini 2.5 Flash (Contextual LLM)</td>
                      <td>
                        <span
                          style={{
                            fontWeight: "700",
                            color: result.llm_classification === "SPAM" ? "var(--accent-red)" : "var(--accent-green)",
                          }}
                        >
                          {result.llm_classification}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button onClick={downloadReport} className="download-btn">
                💾 DOWNLOAD JSON AUDIT REPORT
              </button>
            </div>
          )}
        </div>

        {/* Right column: Audit history */}
        <div>
          <div className="brutal-card" style={{ height: "calc(100% - 2rem)" }}>
            <div className="history-controls">
              <h3 style={{ margin: 0 }}>Audit History</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="theme-btn clear-btn">
                  CLEAR ALL
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p style={{ opacity: 0.6, fontSize: "0.95rem" }}>
                No audits run yet. Analyzed emails will appear here.
              </p>
            ) : (
              <div className="history-section">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => loadHistoryItem(item)}
                  >
                    <div className="history-header">
                      <span>{item.timestamp}</span>
                      <span
                        className={`history-mini-badge`}
                        style={{
                          backgroundColor: item.llm_classification === "SPAM" ? "var(--accent-red)" : "var(--accent-green)",
                          color: item.llm_classification === "SPAM" ? "#ffffff" : "#000000"
                        }}
                      >
                        Gemini: {item.llm_classification === "SPAM" ? "Spam" : "Not Spam"}
                      </span>
                    </div>
                    <div className="history-text">{item.text}</div>
                    <div className="history-meta">
                      <span
                        className="history-mini-badge"
                        style={{
                          backgroundColor:
                            item.final_priority === "HIGH"
                              ? "var(--accent-red)"
                              : item.final_priority === "MEDIUM"
                              ? "var(--accent-yellow)"
                              : "var(--accent-blue)",
                          color: item.final_priority === "LOW" || item.final_priority === "MEDIUM" ? "#000000" : "#ffffff"
                        }}
                      >
                        {item.final_priority}
                      </span>
                      <span className="history-mini-badge" style={{ opacity: 0.7 }}>
                        ML: {item.ml_classification === "SPAM" ? "Spam" : "Not Spam"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
