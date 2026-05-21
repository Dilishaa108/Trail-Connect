import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListDestinations, useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Mountain, Compass, Shield, Activity, ArrowRight, MapPin, Clock, TrendingUp, Users } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { data: destinations } = useListDestinations();
  const { data: summary } = useGetAnalyticsSummary();

  const featured = destinations?.slice(0, 3) ?? [];

  function difficultyLabel(score: number) {
    if (score <= 50) return { label: "Easy", color: "bg-emerald-100 text-emerald-700" };
    if (score <= 75) return { label: "Moderate", color: "bg-amber-100 text-amber-700" };
    return { label: "Hard", color: "bg-red-100 text-red-700" };
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-br from-[hsl(185,62%,10%)] via-[hsl(185,50%,18%)] to-[hsl(200,40%,24%)]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=60')", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="container mx-auto px-4 sm:px-8 relative z-10 py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Platform
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              The professional<br />
              <span className="text-[hsl(15,80%,70%)]">trekking platform</span>
            </h1>
            <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl">
              Plan, book, and manage Himalayan expeditions with route intelligence, 
              real-time guide availability, elevation analytics, and emergency-ready contacts.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="lg" className="bg-[hsl(15,60%,50%)] hover:bg-[hsl(15,60%,44%)] text-white border-0 px-8 py-6 text-base font-semibold" onClick={() => setLocation("/explore")}>
                Explore Routes <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base" onClick={() => setLocation("/register")}>
                Create Account
              </Button>
            </div>

            {/* Live chips */}
            <div className="flex items-center gap-3 mt-10 flex-wrap">
              {["Live weather data", "Route simulation", "Emergency-ready"].map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/15 text-white/75 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Mountain, label: "Curated Routes", value: summary?.totalDestinations ?? "15" },
              { icon: Users, label: "Active Trekkers", value: summary?.totalUsers ?? "—" },
              { icon: TrendingUp, label: "Trek Bookings", value: summary?.totalTreks ?? "—" },
              { icon: Shield, label: "Emergency Ready", value: "24/7" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured routes */}
      <section className="container mx-auto px-4 sm:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Expeditions</h2>
            <p className="text-muted-foreground mt-1">Hand-picked routes for every level of trekker</p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/explore")} className="hidden sm:flex items-center gap-1.5">
            View all routes <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map(dest => {
            const { label, color } = difficultyLabel(dest.difficulty);
            return (
              <button
                key={dest.id}
                onClick={() => setLocation(`/destinations/${dest.id}`)}
                className="group text-left rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="relative h-52 overflow-hidden">
                  {dest.imageUrl ? (
                    <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <Mountain className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-xs opacity-80 flex items-center gap-1"><MapPin className="h-3 w-3" />{dest.region}</div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg leading-tight mb-1">{dest.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-snug line-clamp-2">{dest.route}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{dest.duration}</span>
                      <span className="flex items-center gap-1"><Mountain className="h-3.5 w-3.5" />{dest.maxAltitude}</span>
                    </div>
                    <span className={`text-xs font-medium ${dest.seatsLeft <= 3 ? "text-destructive" : "text-emerald-600"}`}>
                      {dest.seatsLeft} seats left
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex sm:hidden mt-6">
          <Button variant="outline" className="w-full" onClick={() => setLocation("/explore")}>
            View all routes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 border-y">
        <div className="container mx-auto px-4 sm:px-8 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Built for serious expeditions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Compass, title: "15 Verified Routes", desc: "Every route vetted with accurate elevation data, guide ratings, and current booking status." },
              { icon: Activity, title: "Elevation Analytics", desc: "Interactive elevation profiles for every trek so you can assess the challenge before committing." },
              { icon: Shield, title: "Emergency Ready", desc: "Hospital contacts and emergency numbers preloaded for every route. SOS-ready at every waypoint." },
              { icon: Users, title: "Expert Guides", desc: "NMA-certified and TAAN-registered guides with ratings, language skills, and availability at a glance." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl border p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to plan your expedition?</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">Join trekkers and expedition companies using Trail Connect to plan safer, smarter journeys.</p>
        <Button size="lg" className="px-10 py-6 text-base font-semibold" onClick={() => setLocation("/register")}>
          Get started — it's free
        </Button>
      </section>
    </Layout>
  );
}
