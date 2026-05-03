import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarDays, Wallet, Receipt, LogOut, Stethoscope, Bell, Package, FileText, ShieldCheck, FolderHeart, UserCog,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfessional } from "@/hooks/useProfessional";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AlertsBell from "@/components/AlertsBell";
import { useClinic } from "@/hooks/useClinic";

const baseNav = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/prontuarios", label: "Prontuários", icon: FolderHeart },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/almoxarifado", label: "Almoxarifado", icon: Package },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { profile } = useProfessional();
  const { clinic } = useClinic();
  const location = useLocation();
  const nav = isAdmin
    ? [...baseNav, { to: "/admin/solicitacoes", label: "Solicitações", icon: ShieldCheck }]
    : baseNav;
  const current = nav.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gold-soft flex items-center justify-center overflow-hidden">
              {clinic.logoUrl ? (
                <img src={clinic.logoUrl} alt={`${clinic.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <Stethoscope className="h-5 w-5 text-gold-deep" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl leading-none truncate">{clinic.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Painel de gestão</p>
            </div>
          </div>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              cn(
                "mt-4 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-gold-soft text-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )
            }
          >
            <UserCog className="h-4 w-4 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="leading-tight">Meu perfil</span>
              {profile?.meta?.label && (
                <span className="text-xs text-gold-deep truncate">{profile.meta.label}</span>
              )}
            </div>
          </NavLink>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-gold-soft text-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" />Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-6">
          <h1 className="font-display text-2xl">{current?.label ?? "Painel"}</h1>
          <div className="flex items-center gap-2">
            <AlertsBell />
            <Button variant="ghost" size="sm" onClick={signOut} className="md:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 min-h-0 p-6 overflow-auto flex flex-col">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
