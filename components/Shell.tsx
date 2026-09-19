"use client";

import { usePathname } from "next/navigation";
import { AppProvider } from "@/lib/store";
import { TabBar } from "./Nav";
import { BigOffer, HelpSheet, Toaster } from "./Sheets";

function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hideTabs = path?.startsWith("/onboarding");
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div id="main" className={`page ${hideTabs ? "page-no-tabs" : ""}`}>
        {children}
      </div>
      <Toaster />
      <BigOffer />
      <HelpSheet />
      {hideTabs ? null : <TabBar />}
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Chrome>{children}</Chrome>
    </AppProvider>
  );
}
