// CIN = 21 characters: L/U + 5-digit NIC + 2-letter state + 4-digit year + 3-letter ownership + 6-digit reg. no.
export const CIN_REGEX = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

const OWNERSHIP = {
  PLC: "Public Limited Company",
  PTC: "Private Limited Company",
  OPC: "One Person Company",
  GOI: "Government of India company",
  SGC: "State Government company",
  FTC: "Subsidiary of foreign company",
  FLC: "Financial lease company",
  NPL: "Not-for-profit (Section 8) company",
  ULL: "Unlimited liability company (with share capital)",
  ULT: "Unlimited liability company",
  GAP: "Guarantee & association public company",
  GAT: "Guarantee & association private company",
};

const STATES = {
  AN: "Andaman & Nicobar", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar",
  CH: "Chandigarh", CT: "Chhattisgarh", DD: "Daman & Diu", DL: "Delhi", DN: "Dadra & Nagar Haveli",
  GA: "Goa", GJ: "Gujarat", HP: "Himachal Pradesh", HR: "Haryana", JH: "Jharkhand", JK: "Jammu & Kashmir",
  KA: "Karnataka", KL: "Kerala", LA: "Ladakh", MH: "Maharashtra", ML: "Meghalaya", MN: "Manipur",
  MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", PB: "Punjab", PY: "Puducherry",
  RJ: "Rajasthan", SK: "Sikkim", TG: "Telangana", TN: "Tamil Nadu", TR: "Tripura", UP: "Uttar Pradesh",
  UR: "Uttarakhand", WB: "West Bengal",
};

export const normalizeCIN = (v) => (v || "").toUpperCase().replace(/\s+/g, "");
export const isValidCIN = (v) => CIN_REGEX.test(normalizeCIN(v));

// Works fully offline — useful as a sanity check and as a fallback when the lookup API is unavailable.
export function decodeCIN(raw) {
  const cin = normalizeCIN(raw);
  if (!CIN_REGEX.test(cin)) return null;
  const st = cin.slice(6, 8), own = cin.slice(12, 15);
  return {
    cin,
    listing: cin[0] === "L" ? "Listed" : "Unlisted",
    nicCode: cin.slice(1, 6),
    stateCode: st,
    state: STATES[st] || st,
    yearOfIncorporation: cin.slice(8, 12),
    ownershipCode: own,
    ownership: OWNERSHIP[own] || own,
    registrationNo: cin.slice(15),
  };
}
