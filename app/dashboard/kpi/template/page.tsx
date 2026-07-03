"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Save, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";
import { getAuthHeaders } from "@/lib/auth-client";

type KpiItem = {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  targetValue?: number | null;
  unit?: string | null;
  scoringType: string;
};

type KpiTemplate = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  items: KpiItem[];
};

type DraftTemplate = KpiTemplate & { isDirty?: boolean; itemDrafts: KpiItem[] };

function useKpiTemplates() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: ["kpi-templates-full"],
    queryFn: async () => {
      const templates = await fetchApiList<KpiTemplate>("/api/kpi/templates", "Gagal memuat template KPI");
      const withItems = await Promise.all(
        (templates || []).map((t) =>
          fetchApiData<KpiTemplate>(`/api/kpi/templates/${t.id}`, "Gagal memuat detail template")
        )
      );
      return withItems;
    },
    staleTime: 30_000,
  });
  const reload = useCallback(() => queryClient.invalidateQueries({ queryKey: ["kpi-templates-full"] }), [queryClient]);
  return { templates: data ?? [], isPending, error, reload };
}

export default function KpiTemplateEditorPage() {
  const router = useRouter();
  const { templates, isPending, error: fetchError, reload } = useKpiTemplates();
  const [drafts, setDrafts] = useState<Record<string, DraftTemplate>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, DraftTemplate> = {};
      for (const t of templates) {
        next[t.id] = prev[t.id] ?? { ...t, itemDrafts: t.items.map((i) => ({ ...i })) };
      }
      return next;
    });
    if (expanded === null && templates.length > 0) setExpanded(templates[0].id);
  }, [templates]);

  const dirtyIds = Object.values(drafts).filter((d) => d.isDirty).map((d) => d.id);
  const totalDirty = dirtyIds.length;

  function setDraft(id: string, updater: (prev: DraftTemplate) => DraftTemplate) {
    setDrafts((prev) => {
      if (!prev[id]) return prev;
      const next = updater(prev[id]);
      const original = templates.find((t) => t.id === id);
      const isDirty =
        next.name !== original?.name ||
        next.description !== original?.description ||
        next.isActive !== original?.isActive ||
        next.itemDrafts.some((item, idx) => {
          const orig = original?.items[idx];
          return !orig || item.weight !== orig.weight || item.targetValue !== orig.targetValue || item.unit !== orig.unit;
        });
      return { ...prev, [id]: { ...next, isDirty } };
    });
  }

  async function saveTemplate(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(id);
    setActionError("");
    try {
      await fetch(`/api/kpi/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: draft.name, description: draft.description, isActive: draft.isActive }),
      }).then(async (r) => { if (!r.ok) throw new Error((await r.json())?.error || "Gagal simpan"); });

      for (const item of draft.itemDrafts) {
        await fetch(`/api/kpi/templates/${id}/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ weight: item.weight, targetValue: item.targetValue, unit: item.unit }),
        }).then(async (r) => {
          if (!r.ok) {
            const p = await r.json().catch(() => null);
            if (!(p?.error?.includes("not found") || r.status === 404)) throw new Error(p?.error || "Gagal simpan item");
          }
        });
      }

      setActionSuccess(`Template "${draft.name}" berhasil disimpan.`);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan template");
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    setSaving("all");
    setActionError("");
    try {
      for (const id of dirtyIds) await saveTemplate(id);
      setActionSuccess(`${dirtyIds.length} template berhasil disimpan.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(null);
    }
  }

  async function createTemplate() {
    if (!createName.trim()) return;
    setCreating(true);
    setActionError("");
    try {
      const r = await fetch("/api/kpi/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: createName.trim(), description: "" }),
      });
      const p = await r.json();
      if (!r.ok || !p.success) throw new Error(p.error || "Gagal membuat template");
      setCreateName("");
      setActionSuccess("Template KPI baru berhasil dibuat.");
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membuat template");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: totalDirty > 0 ? 80 : 0 }}>
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex min-h-[44px] items-center gap-3">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Template KPI</span>
        </button>
      </header>

      {actionError && <div className="card" role="alert" style={{ padding: "10px 16px", color: "#B3362B", borderColor: "#B3362B", fontSize: 13, fontWeight: 600 }}>{actionError}</div>}
      {actionSuccess && <div className="card" role="status" style={{ padding: "10px 16px", color: "#1E6B43", borderColor: "#1E6B43", fontSize: 13, fontWeight: 600 }}>{actionSuccess}</div>}

      {/* New Template */}
      <section className="card" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6E6E6E", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Buat Template Baru</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Nama template KPI..."
            aria-label="Nama template KPI baru"
            onKeyDown={(e) => e.key === "Enter" && createTemplate()}
          />
          <Button onClick={createTemplate} loading={creating} disabled={!createName.trim()}>
            <Plus size={16} /> Buat
          </Button>
        </div>
      </section>

      {isPending ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "#6E6E6E" }}>Memuat template KPI…</div>
      ) : fetchError ? (
        <div className="card" role="alert" style={{ padding: 16, color: "#B3362B" }}>Gagal memuat data template.</div>
      ) : templates.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "#6E6E6E" }}>Belum ada template KPI. Buat template pertama di atas.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {templates.map((template) => {
            const draft = drafts[template.id];
            if (!draft) return null;
            const isExpanded = expanded === template.id;
            return (
              <article key={template.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Card header */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`Template ${draft.name}`}
                  style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: isExpanded ? "1px solid #EBEBEB" : "none" }}
                  onClick={() => setExpanded(isExpanded ? null : template.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(isExpanded ? null : template.id);
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#111111" }}>{draft.name}</span>
                      {draft.isDirty && (
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#8A5A00", background: "rgba(138,90,0,0.1)", padding: "2px 8px", borderRadius: 6 }}>Belum disimpan</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#6E6E6E", marginTop: 2 }}>{draft.itemDrafts.length} metrik</div>
                  </div>

                  {/* Active toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDraft(template.id, (d) => ({ ...d, isActive: !d.isActive })); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: draft.isActive ? "#1E6B43" : "#6E6E6E" }}
                    aria-label={draft.isActive ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {draft.isActive ? <ToggleRight size={22} color="#1E6B43" /> : <ToggleLeft size={22} color="#BBBBBB" />}
                    {draft.isActive ? "Aktif" : "Nonaktif"}
                  </button>

                  {isExpanded ? <ChevronUp size={18} color="#6E6E6E" /> : <ChevronDown size={18} color="#6E6E6E" />}
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Template name field */}
                    <div>
                      <label htmlFor={`tpl-name-${template.id}`} style={{ fontSize: 12, fontWeight: 700, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Nama Template</label>
                      <input
                        id={`tpl-name-${template.id}`}
                        className="input"
                        value={draft.name}
                        onChange={(e) => setDraft(template.id, (d) => ({ ...d, name: e.target.value }))}
                      />
                    </div>

                    {/* Items */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Metrik KPI</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {draft.itemDrafts.map((item, idx) => (
                          <div key={item.id} style={{ background: "#FAFAFA", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111111" }}>{item.name}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                              <div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#6E6E6E", display: "block", marginBottom: 4 }}>Bobot (%)</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid #EBEBEB", borderRadius: 8, overflow: "hidden", background: "#FFF" }}>
                                  <button
                                    type="button"
                                    style={{ width: 32, height: 36, border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#555" }}
                                    aria-label={`Kurangi bobot ${item.name}`}
                                    onClick={() => setDraft(template.id, (d) => ({ ...d, itemDrafts: d.itemDrafts.map((it, i) => i === idx ? { ...it, weight: Math.max(0, it.weight - 5) } : it) }))}
                                  >−</button>
                                  <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 800, fontFamily: "var(--font-mono, monospace)" }}>{Math.round(item.weight)}</span>
                                  <button
                                    type="button"
                                    style={{ width: 32, height: 36, border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#555" }}
                                    aria-label={`Tambah bobot ${item.name}`}
                                    onClick={() => setDraft(template.id, (d) => ({ ...d, itemDrafts: d.itemDrafts.map((it, i) => i === idx ? { ...it, weight: Math.min(100, it.weight + 5) } : it) }))}
                                  >+</button>
                                </div>
                              </div>
                              <div>
                                <label htmlFor={`tpl-${template.id}-target-${item.id}`} style={{ fontSize: 12, fontWeight: 700, color: "#6E6E6E", display: "block", marginBottom: 4 }}>Target</label>
                                <input
                                  id={`tpl-${template.id}-target-${item.id}`}
                                  className="input"
                                  type="number"
                                  value={item.targetValue ?? ""}
                                  onChange={(e) => setDraft(template.id, (d) => ({ ...d, itemDrafts: d.itemDrafts.map((it, i) => i === idx ? { ...it, targetValue: e.target.value ? Number(e.target.value) : null } : it) }))}
                                  style={{ height: 36, fontSize: 13 }}
                                />
                              </div>
                              <div>
                                <label htmlFor={`tpl-${template.id}-unit-${item.id}`} style={{ fontSize: 12, fontWeight: 700, color: "#6E6E6E", display: "block", marginBottom: 4 }}>Satuan</label>
                                <input
                                  id={`tpl-${template.id}-unit-${item.id}`}
                                  className="input"
                                  value={item.unit ?? ""}
                                  onChange={(e) => setDraft(template.id, (d) => ({ ...d, itemDrafts: d.itemDrafts.map((it, i) => i === idx ? { ...it, unit: e.target.value || null } : it) }))}
                                  placeholder="unit, %, pcs…"
                                  style={{ height: 36, fontSize: 13 }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
                      <Button
                        size="sm"
                        onClick={() => saveTemplate(template.id)}
                        loading={saving === template.id}
                        disabled={!draft.isDirty || saving === "all"}
                      >
                        <Save size={14} /> Simpan Perubahan
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Sticky save bar */}
      {totalDirty > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: "linear-gradient(135deg, #FFC93C, #FFA000)",
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 -4px 20px rgba(255,193,7,0.35)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111111" }}>
              {totalDirty} template belum disimpan
            </div>
          </div>
          <Button onClick={saveAll} loading={saving === "all"} style={{ background: "#111111", color: "#FFC107", border: "none", fontWeight: 800 }}>
            <Save size={16} /> Simpan Semua
          </Button>
        </div>
      )}
    </div>
  );
}
