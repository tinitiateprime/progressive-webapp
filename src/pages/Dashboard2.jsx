import { useCatalog } from "../hooks/useCatalog";
import CardNavigation from "../components/cardNavigation/CardNavigation";
import MobileCatalog from "../components/mobileCatalog/MobileCatalog2";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function Dashboard() {
  const { catalog, loading, error } = useCatalog();
  const isMobile = useMediaQuery("(max-width: 900px)");

  return (
    <main>
      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

      {isMobile ? <MobileCatalog catalog={catalog} /> : <CardNavigation catalog={catalog} />}
    </main>
  );
}
