import { useRouter } from "next/router";

export default function OfflinePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <h1 className="text-3xl font-bold">You're offline 📡</h1>
      <p className="text-slate-500 text-sm max-w-xs">
        This page wasn't saved for offline use. Go back and open a subject
        you've already saved offline.
      </p>
      <button
        onClick={() => router.back()}
        className="mt-2 px-5 py-2 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition"
      >
        ← Go Back
      </button>
    </div>
  );
}
