"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowUp, FaHome } from "react-icons/fa";

const HIDDEN_ROUTES = new Set(["/", "/login", "/signup", "/dashboard"]);
const ROUTE_DEPTH_KEY = "tinitiate.mobile-nav-route-depth";
const LAST_ROUTE_KEY = "tinitiate.mobile-nav-last-route";

export default function MobileQuickNav() {
  const router = useRouter();
  const [showTop, setShowTop] = useState(false);
  const [hasDeepTrail, setHasDeepTrail] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastRoute = sessionStorage.getItem(LAST_ROUTE_KEY);
    const currentRoute = router.asPath;
    let routeDepth = Number(sessionStorage.getItem(ROUTE_DEPTH_KEY) || "0");

    if (lastRoute && lastRoute !== currentRoute) {
      routeDepth += 1;
    }

    sessionStorage.setItem(LAST_ROUTE_KEY, currentRoute);
    sessionStorage.setItem(ROUTE_DEPTH_KEY, String(routeDepth));
    setHasDeepTrail(routeDepth > 1);
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

  if (!showTop && !hasDeepTrail) {
    return null;
  }

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  };

  return (
    <nav className="mobile-quick-nav" aria-label="Mobile quick navigation">
      <button className="btn btn-outline" type="button" onClick={goBack}>
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
