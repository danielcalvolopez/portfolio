import type { Metadata } from "next";
import localFont from "next/font/local";
import "./tokens.css";
import "./global.css";
import { RunningHead } from "@/components/RunningHead";
import { FooterLine } from "@/components/FooterLine";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { siteGraph, jsonLdScript } from "@/lib/seo";

const charis = localFont({
  src: [
    {
      path: "../fonts/charis-sil-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/charis-sil-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/charis-sil-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-charis",
  display: "optional",
  preload: false,
});

const archivo = localFont({
  src: [
    {
      path: "../fonts/archivo-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/archivo-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-archivo",
  display: "optional",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dani Calvo · software engineer",
    template: "%s · Dani Calvo",
  },
  description:
    "Front-end engineer at Alkimi, pioneering a new way to run programmatic advertising. I build platforms end to end: spec-first, test-first, with AI as leverage.",
  openGraph: { images: ["/og/home.png"], siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${charis.variable} ${archivo.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(siteGraph()) }}
        />
        <a className="skip label" href="#content">
          Skip to content
        </a>
        <div className="shell">
          <RunningHead />
          <main id="content">{children}</main>
          <FooterLine />
        </div>
      </body>
    </html>
  );
}
