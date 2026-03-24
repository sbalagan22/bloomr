import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const poppinsLight = Poppins({
  variable: "--font-poppins-light",
  subsets: ["latin"],
  weight: ["300"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Bloomr | Cultivating Clarity",
  description:
    "Transform lecture slides into interactive botanical journals. Master your semester while your digital garden flourishes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${poppinsLight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
        <div className="grain-overlay" />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
