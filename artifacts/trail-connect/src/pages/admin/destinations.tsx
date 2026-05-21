import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListDestinations, getListDestinationsQueryKey, useDeleteDestination, useUpdateDestination } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mountain, Pencil, Trash2, Plus } from "lucide-react";

export default function AdminDestinationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: destinations, isLoading } = useListDestinations({}, { query: { queryKey: getListDestinationsQueryKey({}) } });
  const deleteDest = useDeleteDestination();
  const updateDest = useUpdateDestination();

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteDest.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListDestinationsQueryKey({}) });
    toast({ title: "Destination deleted" });
  }

  async function toggleStatus(id: number, current: string) {
    const newStatus = current === "Open" ? "Temporarily Closed" : "Open";
    await updateDest.mutateAsync({ id, data: { bookingStatus: newStatus } });
    queryClient.invalidateQueries({ queryKey: getListDestinationsQueryKey({}) });
    toast({ title: `Status updated to ${newStatus}` });
  }

  function difficultyLabel(score: number) {
    if (score <= 50) return { label: "Easy", cls: "text-emerald-600 bg-emerald-50" };
    if (score <= 75) return { label: "Moderate", cls: "text-amber-600 bg-amber-50" };
    return { label: "Hard", cls: "text-red-600 bg-red-50" };
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/admin")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Destinations</h1>
            <p className="text-muted-foreground text-sm mt-1">{destinations?.length ?? 0} routes in the system</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Route</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Region</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Difficulty</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Duration</th>
                      <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Seats</th>
                      <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(destinations ?? []).map(dest => {
                      const { label, cls } = difficultyLabel(dest.difficulty);
                      return (
                        <tr key={dest.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold">{dest.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-48">{dest.maxAltitude} · {dest.distance}</div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{dest.region}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{dest.duration}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-semibold text-sm ${dest.seatsLeft <= 3 ? "text-destructive" : "text-emerald-600"}`}>
                              {dest.seatsLeft}/{dest.seatsTotal}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                onClick={() => handleDelete(dest.id, dest.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
