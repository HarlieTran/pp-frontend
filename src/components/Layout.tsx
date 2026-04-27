import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChefHat,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import pantryPalLogo from "../../SVGS/pantry-pal-logo.svg";

type AppTab =
  | "dashboard"
  | "pantry"
  | "scan"
  | "recipes"
  | "ai-recipes"
  | "meal-planner"
  | "favourites"
  | "profile";

interface NavItem {
  label: string;
  caption: string;
  icon: React.ReactNode;
  id: AppTab;
}

const primaryNav: NavItem[] = [
  { label: "Dashboard", caption: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, id: "dashboard" },
  { label: "Pantry", caption: "Inventory", icon: <ShoppingBasket className="h-4 w-4" />, id: "pantry" },
  { label: "Scan", caption: "Capture", icon: <ScanLine className="h-4 w-4" />, id: "scan" },
];

const planningNav: NavItem[] = [
  { label: "Recipes", caption: "Matches", icon: <ChefHat className="h-4 w-4" />, id: "recipes" },
  { label: "AI Chef", caption: "Suggestions", icon: <Sparkles className="h-4 w-4" />, id: "ai-recipes" },
  { label: "Meal Planner", caption: "This Week", icon: <CalendarDays className="h-4 w-4" />, id: "meal-planner" },
  { label: "Favourites", caption: "Saved Recipes", icon: <Heart className="h-4 w-4" />, id: "favourites" },
];

const sidebarNav = [...primaryNav, ...planningNav];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onSignOut?: () => void;
}

function SidebarNavSection({
  items,
  activeTab,
  onTabChange,
}: {
  items: NavItem[];
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) {
  return (
    <div className="px-4">
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn("dashboard-side-link", isActive && "is-active")}
            >
              <span className="dashboard-side-link__icon">{item.icon}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold">{item.label}</span>
                <span className={cn("block truncate text-xs text-[rgba(232,234,236,0.66)]", isActive && "text-[rgba(16,18,15,0.62)]")}>
                  {item.caption}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Layout({ children, activeTab, onTabChange, onSignOut }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const user = useMemo(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return { name: "", email: "" };
    try {
      const parsed = JSON.parse(raw) as { name?: unknown; email?: unknown } | null;
      return {
        name: typeof parsed?.name === "string" ? parsed.name : "",
        email: typeof parsed?.email === "string" ? parsed.email : "",
      };
    } catch {
      return { name: "", email: "" };
    }
  }, []);

  const initials = useMemo(() => {
    const name = user.name.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || "";
      const second = parts[1]?.[0] || parts[0]?.[1] || "";
      return (first + second).toUpperCase();
    }
    const email = user.email.trim();
    if (email) return email.slice(0, 2).toUpperCase();
    return "PP";
  }, [user.email, user.name]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !userMenuRef.current) return;
      if (userMenuRef.current.contains(target)) return;
      setIsUserMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col w-full">
      <div className="relative px-4 pt-4" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((value) => !value)}
          className="flex w-full items-center gap-3 rounded-[50px] border border-[#e8eaec] bg-white p-2 pr-4 text-left transition hover:bg-[#dce9dd]"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dce9dd] text-sm font-medium text-[#10120f]">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[#10120f]">{user.name || "Account"}</span>
            <span className="block truncate text-xs text-[rgba(16,18,15,0.48)]">{user.email || "Profile settings"}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[rgba(16,18,15,0.48)] transition ${isUserMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {isUserMenuOpen && (
          <div className="absolute left-4 right-4 top-[calc(100%+0.65rem)] z-50 rounded-[18px] border border-[#e8eaec] bg-white p-2">
            <div className="space-y-1">
	              <button
	                type="button"
	                onClick={() => {
	                  setIsUserMenuOpen(false);
	                  onTabChange("profile");
	                }}
	                className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-[#dce9dd]"
	              >
	                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9dd] text-[#10120f]">
	                  <UserRound className="h-4 w-4" />
	                </span>
	                <span className="text-sm font-medium text-[#10120f]">Settings</span>
	              </button>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-[#dce9dd]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9dd] text-[#10120f]">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[#10120f]">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 pt-6">
        <SidebarNavSection items={sidebarNav} activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="mt-auto px-4 pb-6 pt-12">
        <div className="flex items-center gap-1.5 text-white">
          <img src={pantryPalLogo} alt="PantryPal logo" className="block h-6 w-6 rounded-full object-contain" />
          <span className="inline-flex items-center text-base font-bold leading-none tracking-[0.04em] text-white">PantryPal</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#10120f]">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar hidden xl:flex">{sidebarContent}</aside>

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e8eaec] bg-white/92 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 xl:px-8">
              <div className="flex items-center gap-3">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="xl:hidden rounded-full border-[#e8eaec] bg-white">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[310px] border-[#e8eaec] bg-[#10120f] p-0" showCloseButton={false}>
                    {sidebarContent}
                  </SheetContent>
                </Sheet>

                <div>
	                  <h1 className="page-title text-[#10120f]">
	                    {activeTab === "dashboard"
	                      ? `Welcome, ${user.name?.trim().split(/\s+/)[0] || user.email?.split('@')[0] || "User"}`
	                      : activeTab === "profile"
	                        ? "Settings"
	                        : sidebarNav.find((item) => item.id === activeTab)?.label || "Workspace"}
	                  </h1>
	                </div>
	              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e8eaec] bg-white text-[#10120f]"
                >
                  <Bell className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 xl:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
