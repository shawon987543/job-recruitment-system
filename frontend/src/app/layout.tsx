import type { Metadata } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import AdminThemeProvider from "@/providers/admin-theme-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
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
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} ${manrope.variable}`}
    >
      <body>
        <QueryProvider>
          <AdminThemeProvider>
            {children}
          </AdminThemeProvider>
        </QueryProvider>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            className: "careerhub-toast",
            style: {
              borderRadius: "12px",
              padding: "12px 16px",
              fontFamily: "var(--font-inter), sans-serif",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
            },
            success: {
              style: { borderLeft: "4px solid #16a34a" },
            },
            error: {
              duration: 5000,
              style: { borderLeft: "4px solid #dc2626" },
            },
            loading: {
              style: { borderLeft: "4px solid #2563eb" },
            },
          }}
        />
      </body>
    </html>
  );
}
