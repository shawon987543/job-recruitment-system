import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import AdminThemeProvider from "@/providers/admin-theme-provider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "CareerHub | Find Your Next Opportunity",
  description:
    "Discover opportunities, manage your applications, and build your career with CareerHub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <QueryProvider>
          <AdminThemeProvider>
            {children}
          </AdminThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}