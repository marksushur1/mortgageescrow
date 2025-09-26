"use client";

import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;
type Column = { key: string; label: string; type?: "text" | "email" | "number" };

function Modal({
  open,
  onClose,
  children,
  title,
}: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "grid", placeItems: "center", zIndex: 50
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#10162f", borderRadius: 12, padding: 20, minWidth: 360, boxShadow: "0 10px 40px rgba(0,0,0,.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: 0, color: "#9db2ff", fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Editor({
  title,
  endpoint,
  columns,
}: {
  title: string;
  endpoint: "/api/customers" | "/api/orders";
  columns: Column[];
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const visibleCols = useMemo(() => columns.map((c) => c.key), [columns]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch");
      setRows(data);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [endpoint]);

  function openNew() {
    setEditing(null);
    const initial: Record<string, any> = {};
    columns.forEach((c) => (initial[c.key] = ""));
    setForm(initial);
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    const initial: Record<string, any> = {};
    columns.forEach((c) => (initial[c.key] = row[c.key] ?? ""));
    setForm(initial);
    setModalOpen(true);
  }

  async function save() {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${endpoint}/${editing.id}` : endpoint;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed");
      return;
    }
    setModalOpen(false);
    await refresh();
  }

  async function remove(id: number) {
    if (!confirm("Delete this row?")) return;
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Failed");
      return;
    }
    await refresh();
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button onClick={openNew} style={{ background: "#3b82f6", color: "white", border: 0, padding: "8px 12px", borderRadius: 8 }}>
          + New
        </button>
      </header>

      <div style={{ overflow: "auto", border: "1px solid #223", borderRadius: 10 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #223" }}>ID</th>
              {columns.map((c) => (
                <th key={c.key} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #223" }}>{c.label}</th>
              ))}
              <th style={{ padding: 10, borderBottom: "1px solid #223" }} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length + 2} style={{ padding: 14 }}>Loading…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={columns.length + 2} style={{ padding: 14, color: "#ffb4b4" }}>{error}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={columns.length + 2} style={{ padding: 14, opacity: 0.8 }}>No rows yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} onClick={() => openEdit(r)} style={{ cursor: "pointer" }}>
                <td style={{ padding: "10px 10px", borderBottom: "1px solid #223" }}>{r.id}</td>
                {visibleCols.map((k) => (
                  <td key={k} style={{ padding: "10px 10px", borderBottom: "1px solid #223" }}>{String(r[k] ?? "")}</td>
                ))}
                <td style={{ padding: "10px 10px", borderBottom: "1px solid #223" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                    style={{ background: "transparent", color: "#ff7b7b", border: "1px solid #552", padding: "6px 10px", borderRadius: 6 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit row" : "Add row"}>
        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          style={{ display: "grid", gap: 12, marginTop: 8 }}
        >
          {columns.map((c) => (
            <label key={c.key} style={{ display: "grid", gap: 6 }}>
              <span>{c.label}</span>
              <input
                value={form[c.key] ?? ""}
                onChange={(e) => setForm((f: any) => ({ ...f, [c.key]: c.type === "number" ? Number(e.target.value) : e.target.value }))}
                type={c.type ?? "text"}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #334", background: "#0e1430", color: "white" }}
              />
            </label>
          ))}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ background: "#253863", color: "#cdd6f4", border: 0, padding: "8px 12px", borderRadius: 8 }}>
              Cancel
            </button>
            <button type="submit" style={{ background: "#22c55e", color: "black", fontWeight: 700, border: 0, padding: "8px 12px", borderRadius: 8 }}>
              Save
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <h1 style={{ fontSize: 26, marginTop: 0, marginBottom: 16 }}>Two editable tables</h1>
      <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 26 }}>
        Click a row to edit. Use “+ New” to add. Changes are saved through REST API routes on Vercel.
      </p>
      <Editor
        title="Customers"
        endpoint="/api/customers"
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email", type: "email" },
        ]}
      />
      <Editor
        title="Orders"
        endpoint="/api/orders"
        columns={[
          { key: "customer_name", label: "Customer Name" },
          { key: "total", label: "Total", type: "number" },
        ]}
      />
    </>
  );
}
