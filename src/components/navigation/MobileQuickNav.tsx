"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowUp, FaHome } from "react-icons/fa";
import { goBackOr, hasAppBackRoute } from "../../lib/navigation";

const HIDDEN_ROUTES = new Set(["/", "/login", "/signup", "/dashboard"]);

export default function MobileQuickNav() {
  const router = useRouter();
  const [showTop, setShowTop] = useState(false);
  const [hasBackTrail, setHasBackTrail] = useState(false);

  useEffect(() => {
    setHasBackTrail(hasAppBackRoute(router.asPath));
  }, [router.asPath]);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 180);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (HIDDEN_ROUTES.has(router.pathname)) {
    return null;
  }

  if (!showTop && !hasBackTrail) {
    return null;
  }

  return (
    <nav className="mobile-quick-nav" aria-label="Mobile quick navigation">
      <button className="btn btn-outline" type="button" onClick={() => goBackOr(router, "/dashboard")}>
        <FaArrowLeft />
        Back
      </button>

      <button className="btn btn-outline" type="button" onClick={() => router.push("/dashboard")}>
        <FaHome />
        Home
      </button>

      {showTop && (
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FaArrowUp />
          Top
        </button>
      )}
    </nav>
  );
}
