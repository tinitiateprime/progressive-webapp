import { useMemo, useState } from "react";
import { groupTopicsIntoRows } from "../../utils/catalogLayout";
import TopicRow from "./TopicRow";

const SUBJECT_LABELS = {
  vuejs: "Vue.js",
  nextjs: "Next.js",
  sqlserver: "SQL Server",
};

function prettySubject(subject) {
  const key = String(subject || "").toLowerCase();
  if (SUBJECT_LABELS[key]) return SUBJECT_LABELS[key];

  return String(subject || "Subject")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SubjectSection({ subjectItem }) {
  const { subject, subject_icon, topics = [] } = subjectItem || {};
  const [iconOk, setIconOk] = useState(true);

  const rows = useMemo(() => groupTopicsIntoRows(topics), [topics]);
  const label = prettySubject(subject);

  return (
    <section className="cnSubject">
      <div className="cnSubjectHeader">
        <div className="cnSubjectLeft">
          {subject_icon && iconOk ? (
            <img
              className="cnSubjectIcon"
              src={subject_icon}
              alt={`${label} icon`}
              onError={() => setIconOk(false)}
              loading="lazy"
            />
          ) : (
            <div className="cnSubjectFallbackIcon">
              {label.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="cnSubjectTitleWrap">
            <h2 className="cnSubjectTitle">{label}</h2>
            <div className="cnSubjectSub">
              {topics.length} topic{topics.length === 1 ? "" : "s"} • {rows.length} row
              {rows.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      <div className="cnRows">
        {rows.map((r) => (
          <TopicRow
            key={`${subject}-row-${r.row}`}
            rowNumber={r.row}
            topics={r.topics}
            showRowLabel={false}
          />
        ))}
      </div>
    </section>
  );
}
