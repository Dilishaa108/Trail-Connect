import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetDestination, getGetDestinationQueryKey,
  useListGuides, getListGuidesQueryKey,
  useCreateTrek,
  useListReviews, getListReviewsQueryKey,
  useCreateReview,
  useListWishlist, getListWishlistQueryKey,
  useAddToWishlist, useRemoveFromWishlist,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Mountain, MapPin, Clock, ArrowLeft, Phone, Building2, AlertCircle, Star, BookOpen, MessageSquare, Send, Heart } from "lucide-react";

function StarRating({ value, onChange, readonly = false, size = "md" }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const px = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const active = hovered || value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
        >
          <Star
            className={`${px} transition-colors ${n <= active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DestinationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [booking, setBooking] = useState(false);
  const [groupSize, setGroupSize] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<number | null>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: dest, isLoading } = useGetDestination(id, {
    query: { queryKey: getGetDestinationQueryKey(id), enabled: !isNaN(id) }
  });

  const { data: guides } = useListGuides(
    { available: true, destinationId: id },
    { query: { enabled: !isNaN(id), queryKey: getListGuidesQueryKey({ available: true, destinationId: id }) } }
  );

  const { data: reviews, isLoading: reviewsLoading } = useListReviews(id, {
    query: { queryKey: getListReviewsQueryKey(id), enabled: !isNaN(id) }
  });

  const { data: wishlist } = useListWishlist(
    { userId: user?.id ?? 0 },
    { query: { enabled: !!user, queryKey: getListWishlistQueryKey({ userId: user?.id ?? 0 }) } }
  );
  const wishlistItem = wishlist?.find(w => w.destinationId === id);

  const createTrek = useCreateTrek();
  const createReview = useCreateReview();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  async function toggleWishlist() {
    if (!user) { setLocation("/login"); return; }
    if (wishlistItem) {
      await removeFromWishlist.mutateAsync({ id: wishlistItem.id });
      toast({ title: "Removed from wishlist" });
    } else {
      await addToWishlist.mutateAsync({ data: { userId: user.id, destinationId: id } });
      toast({ title: "Saved to wishlist!", description: "Find it in your dashboard." });
    }
    queryClient.invalidateQueries({ queryKey: getListWishlistQueryKey({ userId: user?.id ?? 0 }) });
  }

  function difficultyLabel(score: number) {
    if (score <= 50) return { label: "Easy", cls: "bg-emerald-100 text-emerald-700" };
    if (score <= 75) return { label: "Moderate", cls: "bg-amber-100 text-amber-700" };
    return { label: "Hard", cls: "bg-red-100 text-red-700" };
  }

  const elevationData = (dest?.elevationPoints ?? []).map((e, i) => ({
    day: `Day ${i + 1}`,
    elevation: e,
  }));

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews?.filter(r => r.rating === n).length ?? 0,
  }));

  async function handleBook() {
    if (!user) { setLocation("/login"); return; }
    if (!startDate) { toast({ variant: "destructive", title: "Select a start date" }); return; }
    try {
      await createTrek.mutateAsync({
        data: { userId: user.id, destinationId: id, startDate, groupSize, guideId: selectedGuide }
      });
      queryClient.invalidateQueries({ queryKey: getGetDestinationQueryKey(id) });
      toast({ title: "Trek booked!", description: `Your ${dest?.name} expedition is confirmed.` });
      setBooking(false);
      setLocation("/dashboard");
    } catch {
      toast({ variant: "destructive", title: "Booking failed", description: "Please try again." });
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setLocation("/login"); return; }
    if (!reviewComment.trim()) { toast({ variant: "destructive", title: "Please write a comment" }); return; }
    try {
      await createReview.mutateAsync({
        destinationId: id,
        data: { userId: user.id, rating: reviewRating, comment: reviewComment.trim() }
      });
      queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey(id) });
      toast({ title: "Review posted!", description: "Thanks for sharing your experience." });
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to post review" });
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!dest) {
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-8 py-20 text-center">
          <Mountain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Route not found</h2>
          <Button variant="ghost" onClick={() => setLocation("/explore")}><ArrowLeft className="mr-2 h-4 w-4" />Back to explore</Button>
        </div>
      </Layout>
    );
  }

  const { label, cls } = difficultyLabel(dest.difficulty);
  const itinerary = (dest.itinerary ?? []) as string[];

  return (
    <Layout>
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {dest.imageUrl ? (
          <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Mountain className="h-24 w-24 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 container mx-auto px-4 sm:px-8 pb-6">
          <button onClick={() => setLocation("/explore")} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to routes
          </button>
          <div className="flex items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                <span className="text-white/70 text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{dest.region}</span>
                {avgRating !== null && (
                  <span className="flex items-center gap-1 text-white/80 text-xs">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} ({reviews?.length})
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">{dest.name}</h1>
            </div>
            <div className="ml-auto">
              <span className={`font-semibold text-sm px-3 py-1.5 rounded-full ${dest.seatsLeft <= 3 ? "bg-red-500 text-white" : dest.seatsLeft <= 7 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>
                {dest.bookingStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Duration", value: dest.duration },
                { label: "Max Altitude", value: dest.maxAltitude },
                { label: "Distance", value: dest.distance },
                { label: "Difficulty", value: `${dest.difficulty}/100` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card border rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="font-bold text-sm">{value}</div>
                </div>
              ))}
            </div>

            {/* Route */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Route Overview</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{dest.route}</p>
              </CardContent>
            </Card>

            {/* Elevation chart */}
            {elevationData.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Elevation Profile</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={elevationData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(185,62%,25%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(185,62%,25%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}m`} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString()}m`, "Elevation"]} />
                      <Area type="monotone" dataKey="elevation" stroke="hsl(185,62%,25%)" fill="url(#elevGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Itinerary */}
            {itinerary.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Day-by-Day Itinerary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {itinerary.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── REVIEWS ── */}
            <Card id="reviews">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Trekker Reviews
                    {reviews && reviews.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">({reviews.length})</span>
                    )}
                  </CardTitle>
                  {user && !showReviewForm && (
                    <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)}>
                      Write a review
                    </Button>
                  )}
                  {!user && (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setLocation("/login")}>
                      Sign in to review
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Rating summary */}
                {reviews && reviews.length > 0 && (
                  <div className="flex items-start gap-6 p-4 rounded-xl bg-muted/40">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-foreground leading-none mb-1">{avgRating!.toFixed(1)}</div>
                      <StarRating value={Math.round(avgRating!)} readonly size="sm" />
                      <div className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingCounts.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400 transition-all"
                              style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review form */}
                {showReviewForm && user && (
                  <form onSubmit={handleSubmitReview} className="p-4 rounded-xl border bg-card space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{user.username}</span>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Your rating</label>
                      <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your review</label>
                      <Textarea
                        placeholder="Share your experience on this trek — the highlights, the challenges, tips for others..."
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                        maxLength={1000}
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">{reviewComment.length}/1000</div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={createReview.isPending} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        {createReview.isPending ? "Posting..." : "Post review"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {/* Reviews list */}
                {reviewsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
                  </div>
                ) : reviews && reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="h-9 w-9 text-muted-foreground/25 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No reviews yet — be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(reviews ?? []).map(review => (
                      <div key={review.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary/20 text-secondary-foreground font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                          {review.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm">{review.username}</span>
                            <StarRating value={review.rating} readonly size="sm" />
                            <span className="text-xs text-muted-foreground ml-auto">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Booking card */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Book this Trek</CardTitle>
                  <button
                    onClick={toggleWishlist}
                    title={wishlistItem ? "Remove from wishlist" : "Save to wishlist"}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Heart className={`h-4 w-4 transition-colors ${wishlistItem ? "fill-red-500 text-red-500" : ""}`} />
                    {wishlistItem ? "Saved" : "Save"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking ? (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                      <input type="date" className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Group Size</label>
                      <input type="number" min={1} max={dest.seatsLeft} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={groupSize} onChange={e => setGroupSize(Number(e.target.value))} />
                    </div>
                    {guides && guides.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Guide (optional)</label>
                        <select className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          value={selectedGuide ?? ""} onChange={e => setSelectedGuide(e.target.value ? Number(e.target.value) : null)}>
                          <option value="">No guide selected</option>
                          {guides.map(g => <option key={g.id} value={g.id}>{g.name} — {g.rating}★ — {g.experience}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" onClick={handleBook} disabled={createTrek.isPending}>
                        {createTrek.isPending ? "Booking..." : "Confirm Booking"}
                      </Button>
                      <Button variant="outline" onClick={() => setBooking(false)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center py-2">
                      <div className="text-3xl font-bold mb-1">{dest.seatsLeft}</div>
                      <div className="text-sm text-muted-foreground">seats available</div>
                    </div>
                    <Button className="w-full" disabled={dest.seatsLeft === 0}
                      onClick={() => { if (!user) setLocation("/login"); else setBooking(true); }}>
                      {dest.seatsLeft === 0 ? "Fully Booked" : user ? "Book Now" : "Sign in to Book"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Guides */}
            {guides && guides.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Available Guides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guides.slice(0, 2).map(g => (
                    <div key={g.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {g.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{g.name}</div>
                        <div className="text-xs text-muted-foreground">{g.experience} · {g.languages}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-medium">{g.rating}</span>
                          <span className="text-xs text-muted-foreground ml-1">{g.license}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Emergency */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {dest.hospitalName && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-800 text-xs">{dest.hospitalName}</div>
                      {dest.emergencyPhone && <div className="text-red-600 text-xs flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{dest.emergencyPhone}</div>}
                    </div>
                  </div>
                )}
                {dest.hotelName && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-xs">{dest.hotelName}</div>
                      {dest.hotelPhone && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{dest.hotelPhone}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
