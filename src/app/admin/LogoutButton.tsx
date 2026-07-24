"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ email }: { email: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{email}</span>
      <button className="btn btn-secondary" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}
