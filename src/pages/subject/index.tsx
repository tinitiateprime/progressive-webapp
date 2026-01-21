"use client";
import { useRouter } from "next/router";
import { useCachedData } from "../../components/useCachedData";

export default function Topics() {
  const router = useRouter();
  const { subject } = router.query;
  const { data } = useCachedData();

  if (!subject || !data) return null;

  const topics = data[subject as string];

  return (
    <div style={{ padding: 40 }}>
      <h1>{subject?.toString().toUpperCase()}</h1>

      {topics.map((t: any, i: number) => {
        const topicName = Object.keys(t)[0];
        return (
          <button
            key={i}
            onClick={() => router.push(`/subject/${subject}/${topicName}`)}
            style={{ display: "block", margin: "10px 0" }}
          >
            {topicName}
          </button>
        );
      })}
    </div>
  );
}
