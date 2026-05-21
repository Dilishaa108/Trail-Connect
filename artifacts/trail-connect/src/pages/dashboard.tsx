import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  useListTreks, getListTreksQueryKey,
  useUpdateTrek, useDeleteTrek,
  useGetUser, getGetUserQueryKey,
  useListWishlist, getListWishlistQueryKey,
  useRemoveFromWishlist,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Mountain, Compass, CheckCircle2, Clock, Trash2, MapPin, PlusCircle, Heart, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700",
  active: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-muted text-muted-foreground",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | "planned" | "completed" | "wishlist">("all");

  const { data: treks, isLoading: treksLoading } = useListTreks(
    { userId: user?.id },
    { query: { enabled: !!user, queryKey: getListTreksQueryKey({ userId: user?.id }) } }
  );

  const { data: profile } = useGetUser(user?.id!, {
    query: { enabled: !!user, queryKey: getGetUserQueryKey(user?.id!) }
  });

  const { data: wishlist, isLoading: wishlistLoading } = useListWishlist(
    { userId: user?.id ?? 0 },
    { query: { enabled: !!user, queryKey: getListWishlistQueryKey({ userId: user?.id ?? 0 }) } }
  );

  const updateTrek = useUpdateTrek();
  const deleteTrek = useDeleteTrek();
  const removeFromWishlist = useRemoveFromWishlist();

  const filtered = (treks ?? []).filter(t => {
    if (tab === "planned") return t.status === "planned";
    if (tab === "completed") return t.status === "completed";
    if (tab === "wishlist") return false;
    return true;
  });

  async function markComplete(id: number) {
    await updateTrek.mutateAsync({ id, data: { status: "completed", endDate: new Date().toISOString().split("T")[0] } });
    queryClient.invalidateQueries({ queryKey: getListTreksQueryKey({ userId: user?.id }) });
    toast({ title: "Trek marked as completed!" });
  }

  async function handleDelete(id: number) {
    await deleteTrek.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListTreksQueryKey({ userId: user?.id }) });
    toast({ title: "Trek cancelled" });
  }

  async function handleRemoveWishlist(id: number) {
    await removeFromWishlist.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListWishlistQueryKey({ userId: user?.id ?? 0 }) });
    toast({ title: "Removed from wishlist" });
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const stats = [
    { icon: Mountain, label: "Total Treks", value: profile?.totalTreks ?? treks?.length ?? 0 },
    { icon: CheckCircle2, label: "Completed", value: profile?.completedTreks ?? treks?.filter(t => t.status === "completed").length ?? 0 },
    { icon: Clock, label: "Planned", value: treks?.filter(t => t.status === "planned").length ?? 0 },
    { icon: Heart, label: "Wishlist", value: wishlist?.length ?? 0 },
  ];

  const tabs = [
    { key: "all", label: "All" },
    { key: "planned", label: "Planned" },
    { key: "completed", label: "Completed" },
    { key: "wishlist", label: "Wishlist", badge: wishlist?.length },
  ] as const;

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, <span className="text-primary">{user.username}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Your trek dashboard and expedition log</p>
          </div>
          <Button onClick={() => setLocation("/explore")} className="self-start sm:self-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Book a Trek
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card
              key={label}
              className={label === "Wishlist" ? "cursor-pointer hover:border-primary/40 transition-colors" : ""}
              onClick={label === "Wishlist" ? () => setTab("wishlist") : undefined}
            >
              <CardContent className="p-5 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-2 ${label === "Wishlist" ? "text-red-400" : "text-primary"}`} />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trek list / Wishlist */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {tab === "wishlist" ? "My Wishlist" : "My Expeditions"}
              </CardTitle>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.label}
                    {"badge" in t && t.badge !== undefined && t.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {tab === "wishlist" ? (
              /* ── WISHLIST TAB ── */
              wishlistLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !wishlist || wishlist.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No saved routes yet.</p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setLocation("/explore")}>
                    Explore routes
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map(item => {
                    const dest = item.destination;
                    if (!dest) return null;
                    const difficulty = dest.difficulty ?? 50;
                    const diffCls = difficulty > 75 ? "text-red-600 bg-red-50" : difficulty > 50 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50";
                    const diffLabel = difficulty > 75 ? "Hard" : difficulty > 50 ? "Moderate" : "Easy";
                    return (
                      <div key={item.id} className="relative rounded-xl border bg-card overflow-hidden group hover:shadow-md transition-shadow">
                        {dest.imageUrl && (
                          <div className="h-28 overflow-hidden">
                            <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/10 to-black/40" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diffCls}`}>{diffLabel}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="h-3 w-3" />{dest.region}</span>
                              </div>
                              <h3 className="font-bold text-sm leading-tight">{dest.name}</h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dest.duration}</span>
                                <span className="flex items-center gap-1"><Mountain className="h-3 w-3" />{dest.maxAltitude}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleRemoveWishlist(item.id)}
                                className="h-7 w-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                title="Remove from wishlist"
                              >
                                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              onClick={() => setLocation(`/destinations/${dest.id}`)}
                            >
                              View Details <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setLocation(`/destinations/${dest.id}`)}
                            >
                              Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ── TREK TABS ── */
              treksLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Mountain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No {tab === "all" ? "" : tab} treks yet.</p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setLocation("/explore")}>Explore routes</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(trek => (
                    <div key={trek.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mountain className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{trek.destinationName ?? `Trek #${trek.id}`}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[trek.status] ?? STATUS_COLORS.cancelled}`}>
                            {trek.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{trek.startDate}</span>
                          <span>{trek.groupSize} person{trek.groupSize !== 1 ? "s" : ""}</span>
                          {trek.guideName && <span>Guide: {trek.guideName}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {trek.status === "planned" && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => markComplete(trek.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(trek.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
