// ---------------------------------------------------------------------------
// Reference data: Rule 3, Table A & Table B, Companies (Cost Records and
// Audit) Rules, 2014 — current text after the 14.07.2016, 20.12.2017 and
// 03.12.2018 amendments (headings are now "Customs Tariff Act" headings,
// commonly still referred to as CETA codes; they align with HSN headings).
// "ranges: null" = pure service/description item, not classifiable by code.
// ---------------------------------------------------------------------------
export const parseHeadings = (raw) => {
  if (!raw) return null;
  return raw.split(";").map((seg) => seg.trim()).filter(Boolean).map((seg) => {
    const m = seg.match(/(\d+)\s*to\s*(\d+)/i);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
    const n = parseInt(seg.replace(/[^\d]/g, ""), 10);
    return [n, n];
  });
};

const RAW = [
  // --- Table A: Regulated Sectors ---
  { table: "A", sl: "1", name: "Telecommunication services (TRAI-regulated)", headings: null },
  { table: "A", sl: "2", name: "Electricity — generation", headings: "2716" },
  { table: "A", sl: "2", name: "Electricity — transmission, distribution & supply (service)", headings: null },
  { table: "A", sl: "3", name: "Petroleum products", headings: "2709 to 2715" },
  { table: "A", sl: "3", name: "Petroleum — other regulated activity (PNGRB, service)", headings: null },
  { table: "A", sl: "4", name: "Drugs and pharmaceuticals", headings: "2901 to 2942; 3001 to 3006" },
  { table: "A", sl: "5", name: "Fertilisers", headings: "3102 to 3105" },
  { table: "A", sl: "6", name: "Sugar and industrial alcohol", headings: "1701; 1703; 2207" },

  // --- Table B: Non-regulated Sectors ---
  { table: "B", sl: "1", name: "Machinery for defence, space & atomic energy", headings: "8401; 8801 to 8805; 8901 to 8908" },
  { table: "B", sl: "2", name: "Turbo jets and turbo propellers", headings: "8411" },
  { table: "B", sl: "3", name: "Arms, ammunitions and explosives", headings: "3601 to 3603; 9301 to 9306" },
  { table: "B", sl: "4", name: "Propellant powders, fuses, detonators, igniters", headings: "3601 to 3603" },
  { table: "B", sl: "5", name: "Radar / radio-navigation / radio remote-control apparatus", headings: "8526" },
  { table: "B", sl: "6", name: "Tanks & armoured fighting vehicles (≥90% govt funded)", headings: "8710" },
  { table: "B", sl: "7", name: "Port services (Major Port Trusts Act, service)", headings: null },
  { table: "B", sl: "8", name: "Aeronautical services (AERA, service)", headings: null },
  { table: "B", sl: "9", name: "Iron and steel", headings: "7201 to 7229; 7301 to 7326" },
  { table: "B", sl: "10", name: "Roads & other infrastructure projects (service)", headings: null },
  { table: "B", sl: "11", name: "Rubber and allied products", headings: "4001 to 4017" },
  { table: "B", sl: "12", name: "Coffee and tea", headings: "0901 to 0902" },
  { table: "B", sl: "13", name: "Railway/tramway locomotives & rolling stock", headings: "8601 to 8609" },
  { table: "B", sl: "14", name: "Cement", headings: "2523; 6811 to 6812" },
  { table: "B", sl: "15", name: "Ores and mineral products", headings: "2502 to 2522; 2524 to 2526; 2528 to 2530; 2601 to 2617" },
  { table: "B", sl: "16", name: "Mineral fuels (other than petroleum), mineral oils", headings: "2701 to 2708" },
  { table: "B", sl: "17", name: "Base metals", headings: "7401 to 7403; 7405 to 7413; 7419; 7501 to 7508; 7601 to 7614; 7801 to 7802; 7804; 7806; 7901 to 7905; 7907; 8001; 8003; 8007; 8101 to 8113" },
  { table: "B", sl: "18", name: "Inorganic & organic chemicals", headings: "2801 to 2853; 2901 to 2942; 3801 to 3807; 3402 to 3403; 3809 to 3824" },
  { table: "B", sl: "19", name: "Jute and jute products", headings: "5303; 5307; 5310" },
  { table: "B", sl: "20", name: "Edible oil", headings: "1507 to 1518" },
  { table: "B", sl: "21", name: "Construction industry (service)", headings: null },
  { table: "B", sl: "22", name: "Health services — hospitals, diagnostic/clinical centres, labs (service)", headings: null },
  { table: "B", sl: "23", name: "Education services (service)", headings: null },
  { table: "B", sl: "24", name: "Milk powder", headings: "0402" },
  { table: "B", sl: "25", name: "Insecticides", headings: "3808" },
  { table: "B", sl: "26", name: "Plastics and polymers", headings: "3901 to 3914; 3916 to 3921; 3925" },
  { table: "B", sl: "27", name: "Tyres and tubes", headings: "4011 to 4013" },
  { table: "B", sl: "28", name: "Pulp and paper", headings: "4701 to 4704; 4801 to 4802" },
  { table: "B", sl: "29", name: "Textiles", headings: "5004 to 5007; 5106 to 5113; 5205 to 5212; 5303; 5307; 5310; 5401 to 5408; 5501 to 5516" },
  { table: "B", sl: "30", name: "Glass", headings: "7003 to 7008; 7011; 7016" },
  { table: "B", sl: "31", name: "Other machinery and mechanical appliances", headings: "8402 to 8487" },
  { table: "B", sl: "32", name: "Electrical or electronic machinery", headings: "8501 to 8507; 8511 to 8512; 8514 to 8515; 8517; 8525 to 8536; 8538 to 8547" },
  { table: "B", sl: "33", name: "Medical devices (cardiac stents, catheters, implants, etc.)", headings: "9018 to 9022" },
];

export const ENTRIES = RAW.map((e, i) => ({ ...e, id: i, ranges: parseHeadings(e.headings) }));
const HSN_ENTRIES = ENTRIES.filter((e) => e.ranges !== null);

// Find every Table A/B entry whose heading range covers this CETA/HSN code.
export function matchHSN(hsnRaw) {
  const digits = (hsnRaw || "").replace(/[^\d]/g, "");
  if (digits.length < 2) return [];
  if (digits.length >= 4) {
    const target = parseInt(digits.slice(0, 4), 10);
    return HSN_ENTRIES.filter((e) => e.ranges.some(([from, to]) => target >= from && target <= to));
  }
  const chapter = parseInt(digits.slice(0, 2), 10);
  return HSN_ENTRIES.filter((e) =>
    e.ranges.some(([from, to]) => {
      const c1 = Math.floor(from / 100), c2 = Math.floor(to / 100);
      return chapter >= c1 && chapter <= c2;
    })
  );
}

// Resolve each row to a classification entry (or null = not covered) purely from the CETA code.
export function resolveRows(rows) {
  return rows.map((r) => {
    const matches = matchHSN(r.hsn);
    const resolved = matches.length
      ? r.chosenId != null
        ? matches.find((m) => m.id === r.chosenId) || matches[0]
        : matches[0]
      : null;
    return { ...r, matches, resolved };
  });
}

// Rule 3 / Rule 4 applicability engine (logic unchanged from the original App.jsx).
export function computeApplicability({ domestic, exportTo, isMSME, isSEZ, isCaptive, resolvedRows }) {
  const dom = parseFloat(domestic) || 0;
  const exp = parseFloat(exportTo) || 0;
  const total = dom + exp;
  const exportPct = total > 0 ? (exp / total) * 100 : 0;

  let tableA = 0, tableB = 0;
  resolvedRows.forEach((r) => {
    const t = parseFloat(r.turnover) || 0;
    if (r.resolved?.table === "A") tableA += t;
    if (r.resolved?.table === "B") tableB += t;
  });
  const covered = tableA + tableB;

  const recordsReasons = [];
  let recordsApplicable = false;
  if (isMSME) {
    recordsReasons.push("Company is classified as a Micro or Small Enterprise under the MSME Act, 2006 — exempt under the second proviso to Rule 3, regardless of turnover.");
  } else if (covered <= 0) {
    recordsReasons.push("None of the CETA codes entered match a Table A/B heading — Rule 3 only applies to companies engaged in a listed product or service.");
  } else if (total < 35) {
    recordsReasons.push(`Overall turnover (₹${total.toFixed(2)} Cr) is below the ₹35 Cr threshold prescribed in Rule 3.`);
  } else {
    recordsApplicable = true;
    recordsReasons.push(`Overall turnover (₹${total.toFixed(2)} Cr) is ₹35 Cr or more, and the company has turnover from a Table A/B product or service.`);
    recordsReasons.push("Cost records must be maintained in Form CRA-1 for the relevant product(s)/service(s) from FY commencement.");
  }

  const exportExempt = exp > 0 && exportPct > 75;
  const auditExemptReasons = [];
  if (exportExempt) auditExemptReasons.push(`Export revenue is ${exportPct.toFixed(1)}% of total revenue (>75%) — exempt from cost audit under Rule 4(3)(i).`);
  if (isSEZ) auditExemptReasons.push("Company operates from a Special Economic Zone — exempt under Rule 4(3)(ii).");
  if (isCaptive) auditExemptReasons.push("Company generates electricity for captive consumption — exempt under Rule 4(3)(iii).");
  const auditExempt = exportExempt || isSEZ || isCaptive;

  const aReasons = [];
  let aApplicable = false;
  if (!recordsApplicable) {
    aReasons.push("Rule 4 audit thresholds are only tested once Rule 3 (cost records) applies.");
  } else if (tableA <= 0) {
    aReasons.push("No CETA code entered matches a Table A (regulated sector) heading.");
  } else if (auditExempt) {
    aReasons.push(...auditExemptReasons);
  } else if (total < 50) {
    aReasons.push(`Overall turnover (₹${total.toFixed(2)} Cr) is below the ₹50 Cr threshold for regulated-sector audit under Rule 4(1).`);
  } else if (tableA < 25) {
    aReasons.push(`Table A turnover (₹${tableA.toFixed(2)} Cr) is below the ₹25 Cr individual-product threshold under Rule 4(1).`);
  } else {
    aApplicable = true;
    aReasons.push(`Overall turnover ₹${total.toFixed(2)} Cr ≥ ₹50 Cr, and Table A turnover ₹${tableA.toFixed(2)} Cr ≥ ₹25 Cr.`);
  }

  const bReasons = [];
  let bApplicable = false;
  if (!recordsApplicable) {
    bReasons.push("Rule 4 audit thresholds are only tested once Rule 3 (cost records) applies.");
  } else if (tableB <= 0) {
    bReasons.push("No CETA code entered matches a Table B (non-regulated sector) heading.");
  } else if (auditExempt) {
    bReasons.push(...auditExemptReasons);
  } else if (total < 100) {
    bReasons.push(`Overall turnover (₹${total.toFixed(2)} Cr) is below the ₹100 Cr threshold for non-regulated-sector audit under Rule 4(2).`);
  } else if (tableB < 35) {
    bReasons.push(`Table B turnover (₹${tableB.toFixed(2)} Cr) is below the ₹35 Cr individual-product threshold under Rule 4(2).`);
  } else {
    bApplicable = true;
    bReasons.push(`Overall turnover ₹${total.toFixed(2)} Cr ≥ ₹100 Cr, and Table B turnover ₹${tableB.toFixed(2)} Cr ≥ ₹35 Cr.`);
  }

  return { total, exportPct, tableA, tableB, covered, recordsApplicable, recordsReasons, aApplicable, aReasons, bApplicable, bReasons };
}
