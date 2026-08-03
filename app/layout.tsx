import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Modd AI — Fikirden videoya yapay zekâ prodüksiyon",
  description:
    "MODD/group'un yapay zekâ ajansı. Kamera yok. Set yok. Fikirden videoya tamamen yapay zekâ prodüksiyon.",
  openGraph: {
    title: "Modd AI — Fikirden videoya yapay zekâ prodüksiyon",
    description:
      "MODD/group'un yapay zekâ ajansı. Statik görselleri sinematik deneyimlere dönüştürüyoruz.",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
