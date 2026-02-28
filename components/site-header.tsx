"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiCalendar, FiGrid, FiList } from "react-icons/fi";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: FiGrid },
  { href: "/jogos", label: "Jogos", icon: FiCalendar },
  { href: "/cadastros", label: "Cadastros", icon: FiList },
];

export const SiteHeader = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase text-emerald-600">
            Bolao da Familia
          </span>
          <span className="text-lg font-semibold text-slate-900 font-[var(--font-display)]">
            Jogos do Campeonato
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-emerald-500 text-emerald-950"
                    : "border border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
                )}
              >
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
