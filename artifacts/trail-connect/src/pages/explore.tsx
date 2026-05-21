import { useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useListDestinations, getListDestinationsQueryKey,
  useListWishlist, getListWishlistQueryKey,
  useAddToWishlist, useRemoveFromWishlist,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Mountain, MapPin, Clock, Search, SlidersHorizontal, ChevronUp, ChevronDown, Map, LayoutGrid, Heart } from "lucide-react";
import "leaflet/dist/leaflet.css";

const TrekMap = lazy(() =>
  import("@/components/trek-map").then(m => ({ default: m.TrekMap }))
);

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [sortBy, setSortBy] = useState<"difficulty" | "duration" | "name">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<"grid" | "map">("grid");

  const { data: destinations, isLoading } = useListDestinations(
    {},
    { query: { queryKey: getListDestinationsQueryKey({}) } }
  );

  const { data: wishlist } = useListWishlist(
    { userId: user?.id ?? 0 },
    { query: { enabled: !!user, queryKey: getListWishlistQueryKey({ userId: user?.id ?? 0 }) } }
  );

  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const wishlistLookup: Record<number, number> = {};
  for (const w of wishlist ?? []) {
    wishlistLookup[w.destinationId] = w.id;
  }

  async function toggleWishlist(e: React.MouseEvent, destinationId: number) {
    e.stopPropagation();
    if (!user) { setLocation("/login"); return; }

    const existingId = wishlistLookup[destinationId];
    if (existingId !== undefined) {
      await removeFromWishlist.mutateAsync({ id: existingId });
    } else {
      await addToWishlist.mutateAsync({ data: { userId: user.id, destinationId } });
    }
    queryClient.invalidateQueries({ queryKey: getListWishlistQueryKey({ userId: user.id }) });
  }

  const regions = Array.from(new Set(destinations?.map(d => d.region) ?? [])).sort();

  function difficultyScore(d: string) {
    if (!d) return null;
    if (d === "easy") return [0, 50];
    if (d === "moderate") return [51, 75];
    if (d === "hard") return [76, 100];
    return null;
  }

  function difficultyLabel(score: number) {
    if (score <= 50) return { label: "Easy", cls: "text-emerald-600 bg-emerald-50" };
    if (score <= 75) return { label: "Moderate", cls: "text-amber-600 bg-amber-50" };
    return { label: "Hard", cls: "text-red-600 bg-red-50" };
  }

  const filtered = (destinations ?? [])
    .filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.region.toLowerCase().includes(search.toLowerCase())) return false;
      const range = difficultyScore(difficulty);
      if (range && (d.difficulty < range[0] || d.difficulty > range[1])) return false;
      if (region && d.region !== region) return false;
      return true;
    })
    .sort((a, b) => {
      let va: string | number = a.name, vb: string | number = b.name;
      if (sortBy === "difficulty") { va = a.difficulty; vb = b.difficulty; }
      else if (sortBy === "duration") { va = parseInt(a.duration); vb = parseInt(b.duration); }
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Explore Routes</h1>
          <p className="text-muted-foreground">Browse {destinations?.length ?? "—"} verified trekking routes across Nepal</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routes or regions..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy (0–50)</option>
            <option value="moderate">Moderate (51–75)</option>
            <option value="hard">Hard (76–100)</option>
          </select>
          <select
            className="px-3 py-2 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            <option value="">All regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(search || difficulty || region) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setDifficulty(""); setRegion(""); }}>
              Clear
            </Button>
          )}

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-1 self-start sm:self-auto">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === "grid" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === "map" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Map className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Map view */}
        {view === "map" && (
          <div className="mb-6">
            <Suspense fallback={
              <div className="rounded-2xl border bg-muted animate-pulse" style={{ height: 520 }}>
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <Map className="h-5 w-5 mr-2 animate-pulse" /> Loading map…
                </div>
              </div>
            }>
              <TrekMap destinations={filtered} />
            </Suspense>
          </div>
        )}

        {/* Grid view — sort bar + cards */}
        {view === "grid" && (
          <>
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Sort by:</span>
              {(["name", "difficulty", "duration"] as const).map(col => (
                <button
                  key={col}
                  onClick={() => toggleSort(col)}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-muted transition-colors font-medium ${sortBy === col ? "text-primary" : ""}`}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {sortBy === col ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                </button>
              ))}
              <span className="ml-auto text-xs">{filtered.length} routes</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-card overflow-hidden animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Mountain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-1">No routes found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(dest => {
                  const { label, cls } = difficultyLabel(dest.difficulty);
                  const isWishlisted = dest.id in wishlistLookup;
                  return (
                    <div
                      key={dest.id}
                      onClick={() => setLocation(`/destinations/${dest.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setLocation(`/destinations/${dest.id}`)}
                      className="group text-left rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="relative h-48 overflow-hidden">
                        {dest.imageUrl ? (
                          <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Mountain className="h-14 w-14 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                        </div>
                        {/* Wishlist heart */}
                        <button
                          onClick={(e) => toggleWishlist(e, dest.id)}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
                          title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-white"}`}
                          />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white text-xs flex items-center gap-1 opacity-90">
                          <MapPin className="h-3 w-3" />{dest.region}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-base leading-tight mb-1">{dest.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{dest.route}</p>
                        <div className="mb-3">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${dest.difficulty > 75 ? "bg-red-500" : dest.difficulty > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${dest.difficulty}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dest.duration}</span>
                            <span className="flex items-center gap-1"><Mountain className="h-3 w-3" />{dest.maxAltitude}</span>
                          </div>
                          <span className={`font-semibold ${dest.seatsLeft <= 3 ? "text-destructive" : dest.seatsLeft <= 7 ? "text-amber-600" : "text-emerald-600"}`}>
                            {dest.seatsLeft} left
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
