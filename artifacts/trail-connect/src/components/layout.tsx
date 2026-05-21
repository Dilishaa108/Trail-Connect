import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Mountain, LogOut, User as UserIcon, LayoutDashboard, Compass } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-primary/90 transition-colors">
              <Mountain className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">Trail Connect</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> Explore
            </Link>
            {user ? (
              <>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <div className="flex items-center gap-4 border-l pl-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 border-l pl-6">
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto w-full">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">Trail Connect</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Trail Connect. Expeditions managed right.
          </p>
        </div>
      </footer>
    </div>
  );
}
