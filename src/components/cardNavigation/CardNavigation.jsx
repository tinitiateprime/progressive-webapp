// File: src/components/catalog/CardNavigation.jsx
import SubjectSection from "./SubjectSection";

const ORDER = ["nextjs", "sqlserver", "vuejs"];

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export default function CardNavigation({ catalog }) {
  const sorted = [...(catalog || [])].sort((a, b) => {
    const as = normalize(a.subject);
    const bs = normalize(b.subject);

    const ai = ORDER.indexOf(as);
    const bi = ORDER.indexOf(bs);

    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;

    return as.localeCompare(bs);
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 md:px-6 py-5 md:py-8 space-y-6">
      {sorted.map((subjectItem, idx) => (
        <SubjectSection
          key={`${subjectItem.subject}-${idx}`}
          subjectItem={subjectItem}
        />
      ))}
    </div>
  );
}
