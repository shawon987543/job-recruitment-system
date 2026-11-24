import AdminSidebar from "@/components/admin/AdminSidebar";
import "./admin-pages-theme.css";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
