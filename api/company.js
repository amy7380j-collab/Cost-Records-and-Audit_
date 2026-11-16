// Vercel serverless function: GET /api/company?cin=XXXXXXXXXXXXXXXXXXXXX
// Fetches company master data from a data provider and returns one normalised shape.
//
// Env vars (set in Vercel -> Project -> Settings -> Environment Variables):
//   COMPANY_API_PROVIDER = surepass | custom | mock      (default: mock)
//   COMPANY_API_KEY      = your provider token
//   COMPANY_API_URL      = override endpoint (required for "custom")
//
// IMPORTANT: MCA's own portal has a captcha + login and no public API, so this uses a licensed
// data provider. Check the endpoint & response field names against YOUR provider's current docs.

const CIN_REGEX = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

// Return the first non-empty value found at any of the candidate keys (searches nested objects too).
function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== "" && typeof obj[k] !== "object") return String(obj[k]).trim();
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const found = pick(v, keys);
      if (found) return found;
    }
  }
  return "";
}

function normalise(cin, raw, source) {
  return {
    cin,
    name: pick(raw, ["company_name", "companyName", "name", "company"]),
    status: pick(raw, ["company_status", "companyStatus", "status", "active_compliance"]),
    registeredAddress: pick(raw, ["registered_address", "registeredAddress", "registered_office_address", "address"]),
    corporateAddress: pick(raw, ["corporate_address", "corporateAddress", "correspondence_address", "head_office_address"]),
    email: pick(raw, ["email_id", "email", "emailId"]),
    incorporationDate: pick(raw, ["date_of_incorporation", "incorporation_date", "dateOfIncorporation"]),
    category: pick(raw, ["company_category", "category", "companyCategory"]),
    subCategory: pick(raw, ["company_sub_category", "sub_category", "companySubCategory"]),
    roc: pick(raw, ["roc_code", "registrar_of_companies", "roc"]),
    authorisedCapital: pick(raw, ["authorized_capital", "authorised_capital", "authorizedCapital"]),
    paidUpCapital: pick(raw, ["paid_up_capital", "paidup_capital", "paidUpCapital"]),
    source,
  };
}

async function fromSurepass(cin) {
  const url = process.env.COMPANY_API_URL || "https://kyc-api.surepass.io/api/v1/corporate/company-details";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.COMPANY_API_KEY}` },
    body: JSON.stringify({ id_number: cin }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(j.message || `Provider returned HTTP ${r.status}`);
  return j.data || j;
}

async function fromCustom(cin) {
  if (!process.env.COMPANY_API_URL) throw new Error("COMPANY_API_URL is not set");
  const r = await fetch(process.env.COMPANY_API_URL.replace("{cin}", cin), {
    headers: process.env.COMPANY_API_KEY ? { Authorization: `Bearer ${process.env.COMPANY_API_KEY}` } : {},
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || `Provider returned HTTP ${r.status}`);
  return j.data || j;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const cin = String(req.query?.cin || "").toUpperCase().trim();
  if (!CIN_REGEX.test(cin)) return res.status(400).json({ error: "Invalid CIN format." });

  const provider = (process.env.COMPANY_API_PROVIDER || "mock").toLowerCase();
  try {
    if (provider === "mock") {
      // Demo data so the UI and PDF can be tested without a paid API.
      return res.status(200).json({
        company: normalise(cin, {
          company_name: "SAMPLE INDUSTRIES LIMITED (DEMO DATA)",
          company_status: "Active",
          registered_address: "Plot 12, Sample Industrial Estate, Pune, Maharashtra 411019",
          corporate_address: "5th Floor, Demo Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
          email_id: "cs@sample-industries.example",
          date_of_incorporation: "1998-04-17",
          company_category: "Company limited by shares",
        }, "Demo data (provider = mock)"),
      });
    }
    if (!process.env.COMPANY_API_KEY && provider !== "custom") {
      return res.status(500).json({ error: "COMPANY_API_KEY is not configured on the server." });
    }
    const raw = provider === "surepass" ? await fromSurepass(cin) : await fromCustom(cin);
    const company = normalise(cin, raw, `MCA master data via ${provider}`);
    if (!company.name) return res.status(404).json({ error: "No company found for this CIN." });
    return res.status(200).json({ company });
  } catch (e) {
    return res.status(502).json({ error: `Company lookup failed: ${e.message}` });
  }
}
