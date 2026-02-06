import { useCatalog } from "../hooks/useCatalog";
import CardNavigation from "../components/cardNavigation/CardNavigation";
import MobileCatalog2 from "../components/mobileCatalog/MobileCatalog2";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function Dashboard2() {
  const { catalog, loading, error } = useCatalog();
  const isMobile = useMediaQuery("(max-width: 900px)");

  return (
    <main>
      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

      {/* NOTE: Desktop is still CardNavigation (same as dashboard1).
         If you want dashboard2 to look different on desktop too, you need a CardNavigation2. */}
      {isMobile ? <MobileCatalog2 catalog={catalog} /> : <CardNavigation catalog={catalog} />}
    </main>
  );
}
