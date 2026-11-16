import { decodeCIN, isValidCIN, normalizeCIN } from "./cin.js";

// Calls our own serverless function (api/company.js), which holds the provider API key.
// Never put provider keys in frontend code.
export async function lookupCompany(rawCin) {
  const cin = normalizeCIN(rawCin);
  if (!isValidCIN(cin)) throw new Error("Invalid CIN. It must be 21 characters, e.g. L17110MH1973PLC019786.");

  let res;
  try {
    res = await fetch(`/api/company?cin=${encodeURIComponent(cin)}`);
  } catch {
    throw new Error("Could not reach the lookup service. Enter the details manually below.");
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    // e.g. plain `npm run dev` has no /api — use `vercel dev` locally.
    throw new Error("Lookup service is not running here (use `vercel dev` locally). Enter the details manually below.");
  }
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Lookup failed. Enter the details manually below.");
  return { ...body.company, decoded: decodeCIN(cin) };
}
