import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function useIsSmallScreen(query = "(max-width: 900px)") {
  const [isSmall, setIsSmall] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);

    const onChange = (e) => setIsSmall(e.matches);

    // Safari fallback
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    setIsSmall(mq.matches);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [query]);

  return isSmall;
}

export default function HomePage() {
  const navigate = useNavigate();
  const isSmall = useIsSmallScreen();

  const styles = useMemo(() => {
    const h1Size = isSmall ? "40px" : "56px";
    const gridCols = isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))";

    return {
      page: {
        minHeight: "100vh",
        position: "relative",

        // ✅ allow vertical scrolling (prevents clipped UI)
        overflowX: "hidden",
        overflowY: "auto",

        color: "rgba(255,255,255,0.92)",
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(122, 92, 255, 0.30), transparent 60%)," +
          "radial-gradient(900px 500px at 90% 10%, rgba(0, 229, 255, 0.22), transparent 55%)," +
          "linear-gradient(180deg, #05060f 0%, #070a16 40%, #060814 100%)",
      },

      blobA: {
        position: "absolute",
        width: 520,
        height: 520,
        left: -180,
        top: -220,
        background:
          "radial-gradient(circle at 30% 30%, rgba(122,92,255,0.65), transparent 55%)",
        filter: "blur(12px)",
        opacity: 0.9,
        pointerEvents: "none",
      },
      blobB: {
        position: "absolute",
        width: 520,
        height: 520,
        right: -220,
        top: -160,
        background:
          "radial-gradient(circle at 35% 35%, rgba(0,229,255,0.55), transparent 60%)",
        filter: "blur(14px)",
        opacity: 0.85,
        pointerEvents: "none",
      },

      gridOverlay: {
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage:
          "radial-gradient(700px 420px at 50% 22%, rgba(0,0,0,0.95), transparent 70%)",
        opacity: 0.28,
        pointerEvents: "none",
      },

      container: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: isSmall ? "52px 18px 42px" : "70px 24px 50px",
        position: "relative",
        zIndex: 1,
      },

      badgeRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 18,
      },

      badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        fontWeight: 800,
        letterSpacing: 0.2,
        fontSize: 12,
      },

      badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "rgba(0, 229, 255, 0.95)",
        boxShadow:
          "0 0 0 4px rgba(0, 229, 255, 0.12), 0 0 18px rgba(0, 229, 255, 0.55)",
      },

      badgeGhost: {
        fontSize: 12,
        fontWeight: 800,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        opacity: 0.8,
      },

      h1: {
        margin: 0,
        fontSize: h1Size,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        fontWeight: 900, // ✅ safer than 950
        textShadow: "0 16px 50px rgba(0,0,0,0.55)",
      },

      h1Accent: {
        background: "linear-gradient(90deg, rgba(0,229,255,1), rgba(122,92,255,1))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      },

      sub: {
        marginTop: 14,
        maxWidth: 780,
        fontSize: 16,
        lineHeight: 1.65,
        color: "rgba(255,255,255,0.78)",
      },

      ctaRow: {
        marginTop: 22,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      },

      primaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.16)",
        background:
          "linear-gradient(135deg, rgba(0,229,255,0.22), rgba(122,92,255,0.20))," +
          "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 18px 55px rgba(0,0,0,0.45), 0 0 0 6px rgba(0,229,255,0.06)",
        backdropFilter: "blur(10px)",
        transition: "transform 140ms ease, box-shadow 140ms ease",
      },

      btnArrow: {
        display: "inline-block",
        fontWeight: 900,
        opacity: 0.95,
      },

      secondaryBtn: {
        padding: "12px 16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
        cursor: "pointer",
        backdropFilter: "blur(10px)",
      },

      featureGrid: {
        marginTop: 28,
        display: "grid",
        gridTemplateColumns: gridCols,
        gap: 14,
      },

      card: {
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        padding: 16,
      },

      cardTop: {
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      },

      cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, rgba(0,229,255,0.18), rgba(122,92,255,0.18))",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        fontSize: 18,
      },

      cardTitle: {
        fontWeight: 900,
        fontSize: 14,
        letterSpacing: 0.2,
      },

      cardText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.72)",
      },

      cardPillRow: {
        marginTop: 14,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      },

      pill: {
        fontSize: 11,
        fontWeight: 800,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.16)",
        color: "rgba(255,255,255,0.78)",
      },

      footer: {
        marginTop: 26,
      },

      footerLine: {
        height: 1,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
        opacity: 0.7,
      },

      footerText: {
        marginTop: 12,
        fontSize: 12,
        fontWeight: 800,
        opacity: 0.65,
      },
    };
  }, [isSmall]);

  return (
    <main style={styles.page}>
      {/* Ambient blobs */}
      <div style={styles.blobA} />
      <div style={styles.blobB} />

      {/* Subtle grid overlay */}
      <div style={styles.gridOverlay} />

      <section style={styles.container}>
        {/* Top badge */}
        <div style={styles.badgeRow}>
          <span style={styles.badge}>
            <span style={styles.badgeDot} />
            AI • Training • Labs
          </span>
          <span style={styles.badgeGhost}>v1.0</span>
        </div>

        {/* Hero */}
        <h1 style={styles.h1}>
          Build skills for the <span style={styles.h1Accent}>future</span>.
        </h1>

        <p style={styles.sub}>
          Tinitiate IT Training is a curated, JSON-driven learning dashboard.
          Browse subjects, open topics instantly, and learn with a clean,
          scroll-first experience.
        </p>

        {/* CTA row */}
        <div style={styles.ctaRow}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={styles.primaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          >
            Open Dashboard <span style={styles.btnArrow}>→</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard2")}
            style={styles.primaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          >
            Open Dashboard2 <span style={styles.btnArrow}>→</span>
          </button>

           <button
            type="button"
            onClick={() => navigate("/dashboard3")}
            style={styles.primaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          >
            Open Dashboard3 <span style={styles.btnArrow}>→</span>
          </button>

          <button
            type="button"
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={styles.secondaryBtn}
          >
            Explore features
          </button>
        </div>

        {/* Feature cards */}
        <div id="features" style={styles.featureGrid}>
          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.cardIcon}>⚡</div>
              <div>
                <div style={styles.cardTitle}>Fast navigation</div>
                <div style={styles.cardText}>Smooth scrolling rows + instant topic open.</div>
              </div>
            </div>
            <div style={styles.cardPillRow}>
              <span style={styles.pill}>Horizontal</span>
              <span style={styles.pill}>Vertical</span>
              <span style={styles.pill}>Snap</span>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.cardIcon}>🧩</div>
              <div>
                <div style={styles.cardTitle}>JSON-driven</div>
                <div style={styles.cardText}>
                  Subjects, rows and topics are controlled by a catalog JSON.
                </div>
              </div>
            </div>
            <div style={styles.cardPillRow}>
              <span style={styles.pill}>Catalog</span>
              <span style={styles.pill}>GitHub RAW</span>
              <span style={styles.pill}>Extensible</span>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.cardIcon}>📘</div>
              <div>
                <div style={styles.cardTitle}>Markdown lessons</div>
                <div style={styles.cardText}>
                  Open a topic and read clean markdown with code blocks.
                </div>
              </div>
            </div>
            <div style={styles.cardPillRow}>
              <span style={styles.pill}>Docs</span>
              <span style={styles.pill}>Snippets</span>
              <span style={styles.pill}>Practice</span>
            </div>
          </div>
        </div>

        {/* Footer mini */}
        <div style={styles.footer}>
          <div style={styles.footerLine} />
          <div style={styles.footerText}>
            © {new Date().getFullYear()} Tinitiate • Build with consistency • Ship with confidence
          </div>
        </div>
      </section>
    </main>
  );
}
