"use client";

import { useRouter } from "next/router";
import { useEffect, useCallback, useState } from "react";

interface CacheRecord<T> {
  data: T;
  timestamp: number;
}

function useCachedFetch<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const cachedRaw =
          typeof window !== "undefined"
            ? localStorage.getItem(cacheKey)
            : null;

        if (cachedRaw) {
          const cached: CacheRecord<T> = JSON.parse(cachedRaw);
          const isValid = Date.now() - cached.timestamp < ttlMs;
          if (isValid) {
            setData(cached.data);
            setLoading(false);
          }
        }

        try {
          const fresh = await fetcher();
          if (cancelled) return;

          setData(fresh);
          setLoading(false);

          if (typeof window !== "undefined") {
            const record: CacheRecord<T> = {
              data: fresh,
              timestamp: Date.now(),
            };
            localStorage.setItem(cacheKey, JSON.stringify(record));
          }
        } catch (networkErr) {
          if (!cachedRaw) {
            setError(networkErr);
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, ttlMs, fetcher]);

  return { data, loading, error };
}

interface Word {
  id: number;
  text: string;
}

export default function Home() {
  const router = useRouter();

  // Detect PWA vs browser
  useEffect(() => {
    if (router.query.source === "pwa") {
      console.log("Opened from PWA");
    } else {
      console.log("Opened from Browser");
    }
  }, [router.query]);

  // Register service worker (public/sw.js)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    };

    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  // const fetchWords = useCallback(async (): Promise<Word[]> => {
  //   const res = await fetch("/api/words");
  //   if (!res.ok) throw new Error("Failed to fetch words");
  //   return res.json();
  // }, []);

  // const { data: words, loading, error } = useCachedFetch<Word[]>(
  //   "words-cache",
  //   1000 * 60 * 10,
  //   fetchWords
  // );

  // if (loading && !words) return <div className="p-4">Loading...</div>;
  // if (error && !words) return <div className="p-4">Failed to load</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white shadow">
        <div className="flex items-center space-x-3">
          <img
            src="/icon-192.png"
            alt="Logo"
            className="h-10 w-10 rounded"
          />
          <span className="text-xl font-semibold">Tinitiate</span>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Get Started
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <section className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Offline word list</h1>
          <p className="text-gray-600 mb-4">
            Once loaded, you can go offline and refresh; UI and data will still
            show.
          </p>

          {/* <ul className="space-y-2 list-disc list-inside">
            {words?.map((w) => (
              <li key={w.id} className="text-gray-800">
                {w.text}
              </li>
            ))}
          </ul> */}

          <div className="mt-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Browse Tutorials
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
