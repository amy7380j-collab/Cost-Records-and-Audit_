import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// jsPDF's built-in fonts have no Rupee / >= / dash glyphs, so swap them for safe equivalents.
const clean = (s) =>
  String(s ?? "")
    .replace(/₹/g, "Rs. ")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[—–]/g, "-")
    .replace(/·/g, "-")
    .replace(/§/g, "Sec. ")
    .replace(/\s{2,}/g, " ");

const NAVY = [15, 26, 43];
const GOLD = [201, 162, 39];
const GREY = [110, 120, 140];
const GREEN = [24, 120, 80];
const RED = [170, 60, 50];

export function financialYearLabel(date = new Date()) {
  // Rules test turnover of the *immediately preceding* financial year.
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1; // FY starts 1 April
  const start = y - 1;
  return `${start}-${String(y).slice(2)}`;
}

export function buildReport({ company, fy, flags, domestic, exportTo, calc, rows }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 14;
  let y = 0;

  const ensure = (need) => {
    if (y + need > 280) { doc.addPage(); y = 20; }
  };
  const heading = (num, text) => {
    ensure(16);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...NAVY);
    doc.text(`${num}. ${clean(text)}`, M, y);
    doc.setDrawColor(...GOLD).setLineWidth(0.5).line(M, y + 1.8, W - M, y + 1.8);
    y += 8;
  };
  const para = (text, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal").setFontSize(opts.size || 9.5).setTextColor(...(opts.color || [40, 40, 40]));
    const lines = doc.splitTextToSize(clean(text), W - 2 * M - (opts.indent || 0));
    ensure(lines.length * 4.6 + 2);
    doc.text(lines, M + (opts.indent || 0), y);
    y += lines.length * 4.6 + 1.5;
  };
  const after = () => { y = doc.lastAutoTable.finalY + 8; };

  // ---- Title band ----
  doc.setFillColor(...NAVY).rect(0, 0, W, 34, "F");
  doc.setFillColor(...GOLD).rect(0, 34, W, 1.2, "F");
  doc.setTextColor(201, 162, 39).setFont("helvetica", "normal").setFontSize(8.5);
  doc.text("COMPANIES ACT 2013 - SECTION 148", M, 12);
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(17);
  doc.text("Cost Records & Cost Audit Applicability Report", M, 21);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(200, 208, 222);
  doc.text("Companies (Cost Records and Audit) Rules, 2014 - Rule 3 & Rule 4", M, 28);
  y = 45;

  // ---- 1. Company particulars ----
  const d = company.decoded;
  heading(1, "Company Particulars");
  const particulars = [
    ["Company Name", company.name],
    ["CIN", company.cin],
    ["Company Status", company.status],
    ["Registered Office", company.registeredAddress],
    ["Corporate Office", company.corporateAddress],
    ["Date of Incorporation", company.incorporationDate || (d ? `Year ${d.yearOfIncorporation} (from CIN)` : "")],
    ["Company Category", company.category || (d ? d.ownership : "")],
    ["Listing Status (from CIN)", d?.listing],
    ["Email", company.email],
    ["Financial Year Assessed", `FY ${fy}`],
    ["Data Source", company.source || "Entered manually"],
  ].filter(([, v]) => v);
  autoTable(doc, {
    startY: y, body: particulars.map(([k, v]) => [clean(k), clean(v)]), theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.2, textColor: [40, 40, 40], lineColor: [215, 218, 225] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 48, fillColor: [243, 244, 247] } },
    margin: { left: M, right: M },
  });
  after();

  // ---- 2. Turnover summary ----
  heading(2, "Turnover Analysis");
  const money = (n) => `Rs. ${n.toFixed(2)} Cr`;
  autoTable(doc, {
    startY: y, theme: "grid", head: [["Particulars", "Amount / Value"]],
    body: [
      ["Domestic turnover", money(parseFloat(domestic) || 0)],
      ["Export turnover (convertible forex)", money(parseFloat(exportTo) || 0)],
      ["Overall turnover", money(calc.total)],
      ["Export share of total revenue", `${calc.exportPct.toFixed(1)}%`],
      ["Turnover from Table A (regulated) products", money(calc.tableA)],
      ["Turnover from Table B (non-regulated) products", money(calc.tableB)],
    ].map((r) => r.map(clean)),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.2, lineColor: [215, 218, 225] },
    columnStyles: { 1: { halign: "right", font: "courier" } },
    margin: { left: M, right: M },
  });
  after();

  // ---- 3. Conclusion ----
  heading(3, "Applicability Conclusion");
  const auditApplicable = calc.aApplicable || calc.bApplicable;
  autoTable(doc, {
    startY: y, theme: "grid", head: [["Requirement", "Result", "Basis"]],
    body: [
      ["Cost Records (Rule 3)", calc.recordsApplicable ? "COVERED" : "NOT COVERED", calc.recordsReasons.join(" ")],
      ["Cost Audit (Rule 4)", auditApplicable ? "COVERED" : "NOT COVERED",
        `Regulated (Table A): ${calc.aReasons.join(" ")}\nNon-regulated (Table B): ${calc.bReasons.join(" ")}`],
    ].map((r) => r.map(clean)),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.8, cellPadding: 2.4, valign: "top", lineColor: [215, 218, 225] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 }, 1: { fontStyle: "bold", cellWidth: 28, halign: "center" } },
    didParseCell: (h) => {
      if (h.section === "body" && h.column.index === 1) {
        h.cell.styles.textColor = h.cell.raw === "COVERED" ? GREEN : RED;
      }
    },
    margin: { left: M, right: M },
  });
  after();

  // ---- 4. Line-wise coverage ----
  heading(4, "CETA / HSN Code-wise Coverage");
  const lines = rows.filter((r) => r.hsn || r.turnover);
  if (!lines.length) {
    para("No CETA / HSN lines were entered.", { color: GREY });
  } else {
    autoTable(doc, {
      startY: y, theme: "grid",
      head: [["CETA/HSN", "Product", "Table", "Sector (Sl. No.)", "Turnover (Rs. Cr)", "Cost Records", "Cost Audit"]],
      body: lines.map((r) => {
        const t = parseFloat(r.turnover) || 0;
        const rec = calc.recordsApplicable && !!r.resolved;
        const aud = r.resolved?.table === "A" ? calc.aApplicable : r.resolved?.table === "B" ? calc.bApplicable : false;
        return [r.hsn || "-", r.description || "-", r.resolved ? `Table ${r.resolved.table}` : "Not listed",
          r.resolved ? `${r.resolved.sl}. ${r.resolved.name}` : "-", t ? t.toFixed(2) : "-",
          rec ? "Covered" : "Not covered", aud ? "Covered" : "Not covered"].map(clean);
      }),
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 1.8, valign: "top", lineColor: [215, 218, 225] },
      columnStyles: { 4: { halign: "right" } },
      didParseCell: (h) => {
        if (h.section === "body" && (h.column.index === 5 || h.column.index === 6)) {
          h.cell.styles.textColor = h.cell.raw === "Covered" ? GREEN : GREY;
          if (h.cell.raw === "Covered") h.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: M, right: M },
    });
    after();
  }

  // ---- 5. Codes covered under cost audit ----
  heading(5, "Products / HSN Codes Covered under Cost Audit");
  const auditRows = lines.filter((r) =>
    r.resolved?.table === "A" ? calc.aApplicable : r.resolved?.table === "B" ? calc.bApplicable : false
  );
  if (!auditApplicable || !auditRows.length) {
    para("Cost audit is not applicable on the data provided, so no CETA/HSN code is covered under cost audit.", { color: GREY });
  } else {
    autoTable(doc, {
      startY: y, theme: "grid",
      head: [["CETA/HSN", "Product", "Sector (Rule 3 Table / Sl. No.)", "Heading range(s)", "Turnover (Rs. Cr)"]],
      body: auditRows.map((r) => [
        r.hsn, r.description || "-", `Table ${r.resolved.table} - ${r.resolved.sl}. ${r.resolved.name}`,
        r.resolved.headings || "-", (parseFloat(r.turnover) || 0).toFixed(2),
      ].map(clean)),
      headStyles: { fillColor: GOLD, textColor: NAVY, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 1.8, valign: "top", lineColor: [215, 218, 225] },
      columnStyles: { 4: { halign: "right" } },
      margin: { left: M, right: M },
    });
    after();
  }

  // ---- 6. Exemptions ----
  heading(6, "Exemption Flags Considered");
  para(`MSME (Micro/Small Enterprise): ${flags.isMSME ? "Yes" : "No"}`);
  para(`Operates from SEZ: ${flags.isSEZ ? "Yes" : "No"}`);
  para(`Captive power generation only: ${flags.isCaptive ? "Yes" : "No"}`);
  para(`Export revenue above 75% of total: ${calc.exportPct > 75 ? "Yes" : "No"}`);
  y += 3;

  para(
    "Disclaimer: This report is generated from company details fetched from a data provider and turnover figures entered by the user. " +
    "Classification matches the first four digits of the CETA/HSN code against the heading ranges in Rule 3 (Tables A and B). " +
    "It is indicative only and does not replace professional judgment; verify against the Gazette text and consult a practising Cost Accountant before relying on it.",
    { size: 8, color: GREY }
  );

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
    doc.text(clean(`${company.name || "Company"} | ${company.cin}`), M, 290);
    doc.text(`Generated ${new Date().toLocaleDateString("en-IN")}  |  Page ${i} of ${pages}`, W - M, 290, { align: "right" });
  }
  return doc;
}

export function downloadReport(args) {
  const doc = buildReport(args);
  const safe = (args.company.name || args.company.cin).replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
  doc.save(`Cost_Audit_Report_${safe}_FY${args.fy}.pdf`);
}
