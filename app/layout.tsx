import type { Metadata, Viewport } from "next";
import "@fontsource-variable/lexend";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Oracle Go: one calm app for every way to travel",
  description:
    "A 2100 smart-city journey planner for autonomous buses, trains, air taxis and smart roads. Designed to work naturally for everyone.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1F44",
};

/* Apply the saved comfort profile before first paint so text size and contrast never flash. */
const initScript = `try{var p=JSON.parse(localStorage.getItem('oracle-go-profile-v1')||'{}');var d=document.documentElement;d.dataset.text=p.textSize||'standard';d.dataset.contrast=p.contrast||'normal';d.dataset.tap=p.bigButtons?'large':'standard';}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-text="standard" data-contrast="normal" data-tap="standard">
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
