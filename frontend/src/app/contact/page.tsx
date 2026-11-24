import type { Metadata } from "next";
import { ContactUsPage } from "@/components/landing/PublicInfoPages";
import "../home.css";
import "../public-info.css";

export const metadata: Metadata = {
  title: "Contact CareerHub | We’re Here to Help",
  description:
    "Get in touch with CareerHub about candidate support, employer registration, or your account.",
};

export default function ContactPage() {
  return <ContactUsPage />;
}
