import { useNavigate } from "react-router-dom";

export default function TopicCard({ topic }) {
  const navigate = useNavigate();

  const openTopic = () => {
    const md = topic?.md_url;
    if (!md) return;

    const params = new URLSearchParams();
    params.set("md", md);
    params.set("title", topic?.topic_name || "Topic");

    navigate(`/topic?${params.toString()}`);
  };

  return (
    <button className="cnCard" onClick={openTopic} type="button">
      <div className="cnCardTitle">{topic?.topic_name || "Untitled Topic"}</div>
      <div className="cnCardHint">Open →</div>
    </button>
  );
}
