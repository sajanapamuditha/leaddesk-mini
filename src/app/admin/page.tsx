import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import LeadsTable from "./LeadsTable";
import LogoutButton from "./LogoutButton";

export default async function AdminPage() {
  // Belt-and-suspenders: middleware already blocks unauthenticated
  // requests to this route, but checking again here means this page is
  // still safe even if middleware config ever changes.
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="wide-container">
      <div className="admin-header">
        <div>
          <span className="eyebrow">LeadDesk Mini</span>
          <h1 style={{ fontSize: 26, margin: "6px 0 0" }}>Leads</h1>
        </div>
        <LogoutButton email={session.email} />
      </div>

      <LeadsTable />
    </main>
  );
}
