import { useRouter } from "next/router";

export default function OfflinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">You&apos;re offline</h1>
      <p className="max-w-xs text-sm text-slate-500">
        This screen was not cached yet. Open it once while online, or save a subject for
        offline use, and it will be available the next time your connection drops.
      </p>
      <button
        onClick={() => router.back()}
        className="mt-2 rounded-xl bg-cyan-500 px-5 py-2 font-semibold text-white transition hover:bg-cyan-600"
      >
        Go Back
      </button>
    </div>
  );
}
