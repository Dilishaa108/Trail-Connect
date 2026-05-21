import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListGuides, getListGuidesQueryKey, useUpdateGuide } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Phone, BadgeCheck } from "lucide-react";

export default function AdminGuidesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guides, isLoading } = useListGuides({}, { query: { queryKey: getListGuidesQueryKey({}) } });
  const updateGuide = useUpdateGuide();

  async function toggleAvailability(id: number, current: boolean) {
    await updateGuide.mutateAsync({ id, data: { available: !current } });
    queryClient.invalidateQueries({ queryKey: getListGuidesQueryKey({}) });
    toast({ title: `Guide ${!current ? "marked available" : "marked unavailable"}` });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/admin")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Manage Guides</h1>
          <p className="text-muted-foreground text-sm mt-1">{guides?.filter(g => g.available).length ?? 0} of {guides?.length ?? 0} guides currently available</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(guides ?? []).map(guide => (
              <Card key={guide.id} className={!guide.available ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center flex-shrink-0">
                      {guide.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{guide.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-medium">{guide.rating}</span>
                        <span className="text-xs text-muted-foreground">· {guide.totalTreks} treks</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${guide.available ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {guide.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" />{guide.license}</div>
                    <div>{guide.experience} · {guide.languages}</div>
                    {guide.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{guide.phone}</div>}
                  </div>
                  <Button
                    size="sm"
                    variant={guide.available ? "outline" : "default"}
                    className="w-full text-xs"
                    onClick={() => toggleAvailability(guide.id, guide.available)}
                    disabled={updateGuide.isPending}
                  >
                    {guide.available ? "Mark Unavailable" : "Mark Available"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
