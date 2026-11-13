import AdminPageClient from "./admin-page-client";

type AdminPageProps = {
  searchParams: Promise<{
    section?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const section = Array.isArray(params.section)
    ? params.section[0]
    : params.section;

  return (
    <AdminPageClient
      initialSection={
        section === "company-admin" ? "company-admins" : "dashboard"
      }
    />
  );
}
