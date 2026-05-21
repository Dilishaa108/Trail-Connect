import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Mountain, CheckCircle2, Shield, User as UserIcon } from "lucide-react";

export default function AdminUsersPage() {
  const [, setLocation] = useLocation();
  const { data: users, isLoading } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/admin")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground text-sm mt-1">{users?.length ?? 0} registered accounts</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Role</th>
                      <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Total Treks</th>
                      <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Completed</th>
                      <th className="text-right py-3 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(users ?? []).map(u => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-semibold">{u.username}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {u.role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold">{u.totalTreks ?? 0}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-emerald-600 font-semibold">{u.completedTreks ?? 0}</span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-right text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
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
