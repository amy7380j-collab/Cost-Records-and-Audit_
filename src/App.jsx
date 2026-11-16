import React, { useState, useMemo } from "react";
import { Plus, Trash2, Stamp, ChevronDown, ChevronUp, Info, BookOpen, CheckCircle2, CircleHelp, Search, Loader2, FileDown, Building2 } from "lucide-react";
import { ENTRIES, resolveRows, computeApplicability } from "./lib/rules.js";
import { decodeCIN, isValidCIN, normalizeCIN } from "./lib/cin.js";
import { lookupCompany } from "./lib/companyLookup.js";
import { downloadReport, financialYearLabel } from "./lib/report.js";

let nextId = 1;
const newRow = () => ({ id: nextId++, hsn: "", description: "", turnover: "", chosenId: null });

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function Verdict({ applicable, title, reasons }) {
  return (
    <div className={`verdict ${applicable ? "yes" : "no"}`}>
      <div className="stamp-badge">
        <Stamp size={20} />
        <span>{applicable ? "APPLICABLE" : "NOT APPLICABLE"}</span>
      </div>
      <div className="verdict-body">
        <div className="verdict-title">{title}</div>
        <ul>{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
      </div>
    </div>
  );
}

export default function App() {
  const [domestic, setDomestic] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [isMSME, setIsMSME] = useState(false);
  const [isSEZ, setIsSEZ] = useState(false);
  const [isCaptive, setIsCaptive] = useState(false);
  const [rows, setRows] = useState([newRow()]);
  const [showRef, setShowRef] = useState(false);

  const updateRow = (id, field, val) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: val, ...(field === "hsn" ? { chosenId: null } : {}) } : r)));
  const addRow = () => setRows([...rows, newRow()]);
  const removeRow = (id) => setRows(rows.filter((r) => r.id !== id));

  const resolvedRows = useMemo(() => resolveRows(rows), [rows]);
  const calc = useMemo(
    () => computeApplicability({ domestic, exportTo, isMSME, isSEZ, isCaptive, resolvedRows }),
    [domestic, exportTo, isMSME, isSEZ, isCaptive, resolvedRows]
  );

  const [cin, setCin] = useState("");
  const [company, setCompany] = useState({ name: "", registeredAddress: "", corporateAddress: "", source: "" });
  const [fy, setFy] = useState(financialYearLabel());
  const [loading, setLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState(null); // {type: "ok"|"err", text}
  const setC = (field, val) => setCompany((c) => ({ ...c, [field]: val }));

  const runLookup = async () => {
    setLoading(true);
    setLookupMsg(null);
    try {
      const c = await lookupCompany(cin);
      setCompany({ ...c, source: c.source || "MCA master data" });
      setLookupMsg({ type: "ok", text: "Company details fetched. Review them below before generating the report." });
    } catch (e) {
      // Still fill what can be derived from the CIN itself so the user only types the rest.
      const d = decodeCIN(cin);
      if (d) setCompany((c) => ({ ...c, cin: d.cin, decoded: d }));
      setLookupMsg({ type: "err", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const cinOk = isValidCIN(cin);
  const decoded = cinOk ? decodeCIN(cin) : null;
  const canReport = cinOk && company.name.trim().length > 0;
  const handleDownload = () =>
    downloadReport({
      company: { ...company, cin: normalizeCIN(cin), decoded, source: company.source || "Entered manually" },
      fy, flags: { isMSME, isSEZ, isCaptive }, domestic, exportTo, calc, rows: resolvedRows,
    });

  return (
    <div className="wrap">
      <div className="header">
        <div className="eyebrow">Companies Act 2013 · S.148</div>
        <h1 className="title">Cost Audit Applicability Checker</h1>
        <p className="subtitle">
          Companies (Cost Records and Audit) Rules, 2014 — enter turnover plus the CETA code, product name and
          turnover for each line; the app matches each code against Table A / Table B, applies the Rule 3 / Rule 4
          thresholds, and produces a line-by-line coverage report.
        </p>
      </div>

      <div className="container">
        <div className="section">
          <div className="section-head"><span className="section-num">01</span><span className="section-title">Company Details — fetch by CIN</span></div>
          <div className="card">
            <label>Corporate Identification Number (CIN)</label>
            <div className="cin-row">
              <input type="text" value={cin} maxLength={21} onChange={(e) => setCin(e.target.value.toUpperCase())} placeholder="e.g. L17110MH1973PLC019786" />
              <button className="primary-btn" onClick={runLookup} disabled={!cinOk || loading}>
                {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />} Fetch from MCA
              </button>
            </div>
            {cin && !cinOk && <div className="msg err">CIN must be 21 characters: L/U + 5 digits + 2-letter state + 4-digit year + 3-letter type + 6 digits.</div>}
            {decoded && (
              <div className="cin-decoded"><Building2 size={13} /> {decoded.listing} · {decoded.ownership} · {decoded.state} · incorporated {decoded.yearOfIncorporation} · NIC {decoded.nicCode}</div>
            )}
            {lookupMsg && <div className={`msg ${lookupMsg.type}`}>{lookupMsg.text}</div>}

            <div className="field-row" style={{ marginTop: 14 }}>
              <div><label>Company Name</label><input type="text" value={company.name} onChange={(e) => setC("name", e.target.value)} /></div>
              <div><label>Financial Year assessed (preceding FY)</label><input type="text" value={fy} onChange={(e) => setFy(e.target.value)} placeholder="2025-26" /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label>Registered Office</label><input type="text" value={company.registeredAddress} onChange={(e) => setC("registeredAddress", e.target.value)} /></div>
            <div><label>Corporate Office (if different)</label><input type="text" value={company.corporateAddress} onChange={(e) => setC("corporateAddress", e.target.value)} /></div>
          </div>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">02</span><span className="section-title">Turnover & Exemption Flags</span></div>
          <div className="card">
            <div className="field-row">
              <div>
                <label>Domestic Turnover (₹ Crore)</label>
                <input type="number" value={domestic} onChange={(e) => setDomestic(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label>Export Turnover, in convertible forex (₹ Crore)</label>
                <input type="number" value={exportTo} onChange={(e) => setExportTo(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="checks">
              <label className="check-item"><input type="checkbox" checked={isMSME} onChange={(e) => setIsMSME(e.target.checked)} /> Classified as Micro or Small Enterprise (MSME Act, 2006 turnover criteria)</label>
              <label className="check-item"><input type="checkbox" checked={isSEZ} onChange={(e) => setIsSEZ(e.target.checked)} /> Operates from a Special Economic Zone (SEZ)</label>
              <label className="check-item"><input type="checkbox" checked={isCaptive} onChange={(e) => setIsCaptive(e.target.checked)} /> Generates electricity solely for captive consumption</label>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">03</span><span className="section-title">CETA Code-wise Turnover — Auto-classified against Table A/B</span></div>
          <div className="card">
            <div className="hsn-head">
              <span>CETA Code</span><span>Product Name</span><span>Classification</span><span>Turnover ₹Cr</span><span></span>
            </div>
            {resolvedRows.map((r) => (
              <div className="hsn-row" key={r.id}>
                <input type="text" value={r.hsn} onChange={(e) => updateRow(r.id, "hsn", e.target.value)} placeholder="e.g. 30049099" />
                <input type="text" value={r.description} onChange={(e) => updateRow(r.id, "description", e.target.value)} placeholder="Product name" />
                <div>
                  {r.resolved ? (
                    <span className={`badge ${r.resolved.table.toLowerCase()}`}>
                      <CheckCircle2 size={12} /> Table {r.resolved.table} · Sl.{r.resolved.sl}
                    </span>
                  ) : (
                    <span className="badge none"><CircleHelp size={12} /> Not covered</span>
                  )}
                  {r.resolved && <div className="alt-matches">{r.resolved.name}</div>}
                  {r.matches.length > 1 && (
                    <div className="alt-matches">
                      Multiple headings match — confirm:
                      {r.matches.map((m) => (
                        <button key={m.id} className={r.resolved?.id === m.id ? "active" : ""} onClick={() => updateRow(r.id, "chosenId", m.id)}>
                          {m.table}·{m.sl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" value={r.turnover} onChange={(e) => updateRow(r.id, "turnover", e.target.value)} placeholder="0.00" />
                <button className="icon-btn danger" onClick={() => removeRow(r.id)}><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="add-row-btn" onClick={addRow}><Plus size={14} /> Add CETA code line</button>

            <button className="ref-toggle" onClick={() => setShowRef(!showRef)}>
              <BookOpen size={14} /> View full Table A / Table B heading reference
              {showRef ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showRef && (
              <div className="ref-panel">
                <h4>Table A — Regulated Sectors</h4>
                {ENTRIES.filter((e) => e.table === "A").map((e) => (
                  <div className="ref-row" key={e.id}><span>{e.sl}</span><span>{e.name}</span><span>{e.headings || "Not applicable"}</span></div>
                ))}
                <h4>Table B — Non-regulated Sectors</h4>
                {ENTRIES.filter((e) => e.table === "B").map((e) => (
                  <div className="ref-row" key={e.id}><span>{e.sl}</span><span>{e.name}</span><span>{e.headings || "Not applicable"}</span></div>
                ))}
                <p style={{ margin: "10px 0 0", color: "#7889A8" }}>
                  Pure-service items (telecom, ports, aeronautical services, roads/infra, construction, health,
                  education, electricity transmission/distribution) carry no CETA heading — they can't be
                  auto-matched from a code and aren't expected in a CETA-coded turnover breakup.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">04</span><span className="section-title">Turnover Summary</span></div>
          <div className="stats-grid">
            <Stat label="Overall Turnover" value={`₹${calc.total.toFixed(2)} Cr`} />
            <Stat label="Export Share" value={`${calc.exportPct.toFixed(1)}%`} sub={calc.exportPct > 75 ? "exceeds 75% threshold" : null} />
            <Stat label="Table A Turnover" value={`₹${calc.tableA.toFixed(2)} Cr`} />
            <Stat label="Table B Turnover" value={`₹${calc.tableB.toFixed(2)} Cr`} />
          </div>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">05</span><span className="section-title">Rule 3 — Cost Records</span></div>
          <Verdict applicable={calc.recordsApplicable} title="Maintenance of cost records" reasons={calc.recordsReasons} />
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">06</span><span className="section-title">Rule 4 — Cost Audit</span></div>
          <Verdict applicable={calc.aApplicable} title="Regulated sector (Table A) — ₹50 Cr overall / ₹25 Cr product threshold" reasons={calc.aReasons} />
          <Verdict applicable={calc.bApplicable} title="Non-regulated sector (Table B) — ₹100 Cr overall / ₹35 Cr product threshold" reasons={calc.bReasons} />
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">07</span><span className="section-title">CETA Code Classification & Coverage Report</span></div>
          <div className="card">
            {resolvedRows.length === 0 || resolvedRows.every((r) => !r.hsn && !r.turnover) ? (
              <p style={{ margin: 0, fontSize: 13, color: "#7889A8" }}>Add at least one CETA code line above to generate this report.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>CETA Code</th><th>Product</th><th>Table</th><th>Sector (Sl. No.)</th>
                    <th>Turnover ₹Cr</th><th>Cost Records</th><th>Cost Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedRows.map((r) => {
                    const t = parseFloat(r.turnover) || 0;
                    const recCovered = calc.recordsApplicable && !!r.resolved;
                    const auditCovered = r.resolved?.table === "A" ? calc.aApplicable : r.resolved?.table === "B" ? calc.bApplicable : false;
                    return (
                      <tr key={r.id}>
                        <td className="mono">{r.hsn || "—"}</td>
                        <td>{r.description || "—"}</td>
                        <td>{r.resolved ? `Table ${r.resolved.table}` : "Not covered"}</td>
                        <td>{r.resolved ? `${r.resolved.sl}. ${r.resolved.name}` : "—"}</td>
                        <td className="mono">{t ? t.toFixed(2) : "—"}</td>
                        <td className={recCovered ? "yes-cell" : "no-cell"}>{recCovered ? "Covered" : "Not covered"}</td>
                        <td className={auditCovered ? "yes-cell" : "no-cell"}>{auditCovered ? "Covered" : "Not covered"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "#7889A8" }}>
              "Cost Records — Covered" means Rule 3 applies overall (§05) and this code matched a Table A/B heading.
              "Cost Audit — Covered" means the table that this code belongs to has crossed both the overall and
              individual-product thresholds in Rule 4 (§06) and no Rule 4(3) exemption applies.
            </p>
          </div>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">08</span><span className="section-title">PDF Report</span></div>
          <div className="card">
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9FB0C7" }}>
              Generates a PDF with the company particulars, turnover analysis, cost record / cost audit conclusion, and the CETA/HSN codes covered under cost audit.
            </p>
            <button className="primary-btn" onClick={handleDownload} disabled={!canReport}><FileDown size={14} /> Download PDF report</button>
            {!canReport && <div className="msg err">Enter a valid CIN and company name to enable the report.</div>}
          </div>
        </div>

        <div className="disclaimer">
          <Info size={28} />
          <span>
            Auto-classification matches the first 4 digits of the CETA/Customs Tariff code against the heading
            ranges in Rule 3. Some headings (2901–2942, 3601–3603, 5303/5310, etc.) appear in more than one item —
            where a code matches multiple items, confirm which one reflects the actual product using the buttons
            shown on that row. Pure-service items (telecom, ports, construction, health, education, etc.) carry no
            CETA code and are out of scope for a code-based breakup — flag those separately if applicable. This tool
            does not replace professional judgment — confirm against the Gazette text and consult a practising Cost
            Accountant before relying on the result.
          </span>
        </div>
      </div>
    </div>
  );
}
