import type { Metadata } from "next";
import { AboutUsPage } from "@/components/landing/PublicInfoPages";
import "../home.css";
import "../public-info.css";

export const metadata: Metadata = {
  title: "About CareerHub | Connecting People and Opportunity",
  description:
    "Learn how CareerHub helps candidates discover jobs and employers manage their hiring journey.",
};

export default function AboutPage() {
  return <AboutUsPage />;
}
