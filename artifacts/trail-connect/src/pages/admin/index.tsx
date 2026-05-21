import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAnalyticsSummary, useGetPopularRoutes, useGetMonthlyBookings, useGetDifficultyBreakdown } from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { Users, Mountain, CalendarCheck, MapPin, CheckCircle2, UserCheck, ArrowRight } from "lucide-react";

const COLORS = ["hsl(185,62%,25%)", "hsl(15,60%,50%)", "hsl(200,40%,40%)", "hsl(40,80%,50%)", "hsl(160,40%,40%)"];

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = useGetAnalyticsSummary();
  const { data: popularRoutes } = useGetPopularRoutes();
  const { data: monthlyBookings } = useGetMonthlyBookings();
  const { data: difficultyBreakdown } = useGetDifficultyBreakdown();

  const stats = summary ? [
    { icon: Users, label: "Total Users", value: summary.totalUsers, color: "text-blue-600" },
    { icon: Mountain, label: "Destinations", value: summary.totalDestinations, color: "text-primary" },
    { icon: CalendarCheck, label: "Total Bookings", value: summary.totalTreks, color: "text-amber-600" },
    { icon: CheckCircle2, label: "Completed Treks", value: summary.completedTreks, color: "text-emerald-600" },
    { icon: MapPin, label: "Active Bookings", value: summary.activeBookings, color: "text-purple-600" },
    { icon: UserCheck, label: "Guides", value: summary.totalGuides, color: "text-pink-600" },
  ] : [];

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Platform analytics and management</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/destinations")}>
              Destinations <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/guides")}>
              Guides <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/users")}>
              Users <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <Card key={label}>
                <CardContent className="p-5 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly bookings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Bookings (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyBookings ?? []} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(185,62%,25%)" strokeWidth={2} dot={{ r: 3 }} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular routes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most Booked Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(popularRoutes ?? []).slice(0, 7)} margin={{ top: 5, right: 5, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
                  <XAxis dataKey="destinationName" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="bookingCount" fill="hsl(15,60%,50%)" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bookings by Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={difficultyBreakdown ?? []} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={80} label={({ level, percent }) => `${level} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {(difficultyBreakdown ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular routes table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Route Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(popularRoutes ?? []).slice(0, 6).map((route, i) => (
                  <div key={route.destinationId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{route.destinationName}</div>
                      <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (route.bookingCount / Math.max(...(popularRoutes?.map(r => r.bookingCount) ?? [1]))) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary w-8 text-right">{route.bookingCount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
