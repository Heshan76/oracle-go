"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LifeBuoy, Navigation, Route, Search, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/lib/store";
import { Logo } from "./ui";

/** Back button (with a word, not just an arrow), a plain title, and Help that is always in the same place. */
export function TopBar({ title, back, dark = false, brand = false }: { title?: string; back?: string | true; dark?: boolean; brand?: boolean }) {
  const { setHelpOpen } = useApp();
  const router = useRouter();
  return (
    <header className={`topbar ${dark ? "topbar-dark" : ""}`}>
      <div className="topbar-side">
        {brand ? (
          <span className="brand">
            <Logo />
            <span className="brand-name">Oracle Go</span>
          </span>
        ) : back === true ? (
          <button type="button" className="topbtn" onClick={() => router.back()}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back</span>
          </button>
        ) : back ? (
          <Link href={back} className="topbtn">
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back</span>
          </Link>
        ) : null}
      </div>
      {title && !brand ? <h1 className="topbar-title">{title}</h1> : null}
      <div className="topbar-side topbar-right">
        <button type="button" className="topbtn topbtn-help" onClick={() => setHelpOpen(true)} aria-haspopup="dialog">
          <LifeBuoy size={20} aria-hidden="true" />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}

const TABS = [
  { href: "/", label: "Plan", icon: Search, match: (p: string) => p === "/" || p.startsWith("/routes") },
  { href: "/journey", label: "My trip", icon: Route, match: (p: string) => p.startsWith("/journey") || p.startsWith("/rebook") || p.startsWith("/boarding") || p.startsWith("/arrived") },
  { href: "/track", label: "Live map", icon: Navigation, match: (p: string) => p.startsWith("/track") },
  { href: "/onboarding", label: "Comfort", icon: SlidersHorizontal, match: (p: string) => p.startsWith("/onboarding") },
];

export function TabBar() {
  const path = usePathname() || "/";
  const { trip, phase } = useApp();
  const live = trip.started && phase?.kind !== "arrived";
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const active = t.match(path);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={`tab ${active ? "tab-active" : ""}`} aria-current={active ? "page" : undefined}>
            <span className="tab-icon">
              <Icon size={24} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              {t.href === "/track" && live ? <span className="live-dot" aria-hidden="true" /> : null}
            </span>
            <span className="tab-label">{t.label}</span>
            {t.href === "/track" && live ? <span className="sr-only">, journey in progress</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
