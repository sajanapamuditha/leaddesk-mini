"use client";

import { useEffect, useState, useCallback } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  budgetRange: string;
  message: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
};

const STATUS_OPTIONS: Lead["status"][] = ["NEW", "CONTACTED", "CLOSED"];

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchLeads = useCallback(async (query: string, status: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status) params.set("status", status);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounce search input so we're not firing a request per keystroke.
    const timeout = setTimeout(() => fetchLeads(q, statusFilter), 300);
    return () => clearTimeout(timeout);
  }, [q, statusFilter, fetchLeads]);

  async function updateStatus(id: string, status: Lead["status"]) {
    // Optimistic update — flip it in the UI immediately, roll back on failure.
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));

    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setLeads(prev);
      setError("Failed to update status. Please try again.");
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <input
          placeholder="Search by name, email, or message…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading leads…</div>
      ) : leads.length === 0 ? (
        <div className="empty-state">No leads match your search yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Budget</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.email}</td>
                <td>{lead.budgetRange}</td>
                <td className="msg-cell">{lead.message}</td>
                <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td>
                  <select
                    className={`status-select ${lead.status}`}
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value as Lead["status"])}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
