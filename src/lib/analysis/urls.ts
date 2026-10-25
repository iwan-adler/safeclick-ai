/**
 * Heuristic URL inspection.
 *
 * IMPORTANT: nothing in this file performs network requests. URLs are only
 * parsed as strings with the WHATWG `URL` constructor. A finding here is a
 * reason to be careful, not proof that a link is malicious.
 */
import type { UrlFinding, UrlReport } from "./types";

const COMMON_TLDS =
  "com|net|org|io|co|in|info|biz|us|uk|ca|au|de|fr|es|it|nl|ru|cn|me|ly|gl|app|dev|xyz|top|click|link|online|site|live|shop|store|tk|ml|ga|cf|gq|zip|mov|icu|buzz|rest|cam|work|support|do|gd|cc|ws|pw|club|win|loan|vip|mobi|example";

/**
 * Matches, in order of preference:
 *  1. scheme URLs (http/https/other) — `hxxp` is a common "defanged" spelling
 *  2. broken scheme URLs such as "http:/bit.do/x" or "http:ow.ly/x", a trick
 *     used to slip links past filters while phones still make them tappable
 *  3. `www.` URLs
 *  4. bare IPv4 hosts with an optional path
 *  5. bare domains ending in a known TLD, with an optional path
 */
/** Any character that cannot be part of a link (whitespace, <, >, quotes, backtick). */
const NOT_URL_CHAR = String.raw`[^\s<>"'\x60]`;

const BROKEN_SCHEME = /^(?:https?|hxxps?):\/?(?!\/)/i;

const URL_PATTERN = new RegExp(
  [
    String.raw`\b(?:https?|hxxps?|ftp):\/\/` + NOT_URL_CHAR + "+",
    String.raw`\b(?:https?|hxxps?):\/?(?!\/)[\p{L}\p{N}]` + NOT_URL_CHAR + "+",
    String.raw`\bwww\.` + NOT_URL_CHAR + "+",
    String.raw`\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/` + NOT_URL_CHAR + "*)?",
    String.raw`(?<![\p{L}\p{N}@.-])(?:[\p{L}\p{N}][\p{L}\p{N}-]{0,62}\.)+(?:` +
      COMMON_TLDS +
      String.raw`)\b(?:\/` +
      NOT_URL_CHAR +
      "*)?",
  ].join("|"),
  "giu",
);

const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»”’]+$/u;

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "ow.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "buff.ly",
  "rebrand.ly",
  "t.ly",
  "s.id",
  "bit.do",
  "v.gd",
  "smsg.io",
  "shrtco.de",
  "t2m.io",
  "tiny.one",
  "bitly.ws",
  "short.gy",
  "cli.re",
  "x.co",
]);

/**
 * Free website builders, tunnels and redirect services. Anyone can create a
 * site on these in minutes, so organizations rarely send customers to them.
 */
const FREE_HOST_SUFFIXES = [
  "webredirect.org",
  "duckdns.org",
  "ngrok.io",
  "ngrok-free.app",
  "trycloudflare.com",
  "000webhostapp.com",
  "firebaseapp.com",
  "web.app",
  "pages.dev",
  "workers.dev",
  "netlify.app",
  "glitch.me",
  "herokuapp.com",
  "repl.co",
  "weebly.com",
  "wixsite.com",
  "blogspot.com",
  "github.io",
  "square.site",
  "godaddysites.com",
];

const UNCOMMON_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "click",
  "link",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "rest",
  "cam",
  "icu",
  "buzz",
  "work",
  "support",
]);

/** Well-known brands that are frequently imitated in link text. */
const BRANDS = [
  "paypal",
  "amazon",
  "apple",
  "icloud",
  "microsoft",
  "outlook",
  "google",
  "netflix",
  "facebook",
  "instagram",
  "whatsapp",
  "linkedin",
  "dropbox",
  // India
  "sbi",
  "hdfc",
  "icici",
  "axisbank",
  "kotak",
  "paytm",
  "phonepe",
  "yono",
  "npci",
  "uidai",
  "airtel",
  "indiapost",
  "irctc",
  "flipkart",
];

/** Official domains for brands whose real domain does not start with "<brand>.". */
const OFFICIAL_DOMAINS = new Set(["onlinesbi.sbi", "sbi.co.in", "hdfcbank.com", "icicibank.com", "kotak.com", "npci.org.in", "uidai.gov.in", "airtel.in", "indiapost.gov.in", "irctc.co.in"]);

const DECEPTIVE_KEYWORDS = [
  "kyc",
  "netbanking",
  "claim",
  "reward",
  "bonus",
  "prize",
  "login",
  "signin",
  "verify",
  "verification",
  "secure",
  "account",
  "update",
  "wallet",
  "billing",
  "confirm",
  "unlock",
  "suspend",
  "refund",
];

/** Common digit-for-letter substitutions used in lookalike domains. */
const LEET: Record<string, string> = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t" };

const MULTI_PART_SUFFIXES = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);

export function extractUrlCandidates(text: string): { raw: string; start: number; end: number }[] {
  const out: { raw: string; start: number; end: number }[] = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(TRAILING_PUNCTUATION, "");
    if (!raw || match.index === undefined) continue;
    // "name@bank.example" is an email address, not a link.
    if (text[match.index - 1] === "@") continue;
    // Skip things like "e.g" or a lone "a.m" which are not plausible links.
    if (raw.length < 4) continue;
    out.push({ raw, start: match.index, end: match.index + raw.length });
  }
  return out;
}

function registrableDomain(host: string): string {
  const labels = host.split(".");
  if (labels.length <= 2) return host;
  const tld = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  if (tld.length === 2 && MULTI_PART_SUFFIXES.has(second)) {
    return labels.slice(-3).join(".");
  }
  return labels.slice(-2).join(".");
}

function deLeet(value: string): string {
  return value.replace(/[0134579]/g, (d) => LEET[d] ?? d);
}

function parse(raw: string): URL | null {
  let candidate = BROKEN_SCHEME.test(raw) ? `http://${raw.replace(BROKEN_SCHEME, "")}` : raw.replace(/^hxxp/i, "http");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    return url.hostname ? url : null;
  } catch {
    return null;
  }
}

/** Raw host text as typed (before the URL parser converts it to punycode). */
function rawHost(raw: string): string {
  const withoutScheme = raw.replace(BROKEN_SCHEME, "").replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const authority = withoutScheme.split(/[/?#]/)[0];
  const afterAt = authority.includes("@") ? authority.slice(authority.lastIndexOf("@") + 1) : authority;
  return afterAt.replace(/:\d+$/, "");
}

export function inspectUrl(raw: string): Omit<UrlReport, "start" | "end" | "raw"> {
  const findings: UrlFinding[] = [];
  const url = parse(raw);

  if (!url) {
    return {
      host: null,
      findings: [
        {
          id: "malformed",
          label: "Unusual link format",
          detail: "This link could not be read as a normal web address. Malformed links are sometimes used to confuse filters.",
          weight: 10,
        },
      ],
    };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const typedHost = rawHost(raw);
  const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  const isIPv6 = host.startsWith("[");
  const labels = host.split(".");
  const tld = labels[labels.length - 1];

  if (BROKEN_SCHEME.test(raw)) {
    findings.push({
      id: "malformed",
      label: "Broken link format",
      detail: "The link is written as “http:/” or “http:” without the usual “//”. Scammers do this to slip links past filters, while many phones still make them tappable.",
      weight: 12,
    });
  }

  if (isIPv4 || isIPv6) {
    findings.push({
      id: "ip-host",
      label: "Numeric address instead of a name",
      detail: "Most organizations link to a named website. A raw number address hides who runs the site.",
      weight: 22,
    });
  }

  if (/[^\x00-\x7F]/.test(typedHost)) {
    findings.push({
      id: "non-ascii-host",
      label: "Unusual characters in the web address",
      detail: "The address uses non-English letters that can look identical to familiar ones (for example a Cyrillic “a”).",
      weight: 18,
    });
  } else if (labels.some((l) => l.startsWith("xn--"))) {
    findings.push({
      id: "punycode",
      label: "Encoded international address",
      detail: "Addresses starting with “xn--” are encoded international names, which can disguise lookalike spellings.",
      weight: 18,
    });
  }

  if (SHORTENERS.has(host)) {
    findings.push({
      id: "shortener",
      label: "Shortened link",
      detail: "Link shorteners hide the real destination, so you cannot see where it leads before opening it.",
      weight: 14,
    });
  }

  if (url.protocol === "http:" && /^(?:http|hxxp):\/\//i.test(raw)) {
    findings.push({
      id: "insecure-http",
      label: "Not using HTTPS",
      detail: "The link uses plain http://. Legitimate login and payment pages almost always use https://.",
      weight: 6,
    });
  }

  if (url.username || url.password) {
    findings.push({
      id: "at-symbol",
      label: "Hidden destination (@ in address)",
      detail: "Text before an “@” in a web address is ignored by browsers. It can make a link look like it goes somewhere it does not.",
      weight: 20,
    });
  }

  if (!isIPv4 && !isIPv6 && labels.length >= 5) {
    findings.push({
      id: "many-subdomains",
      label: "Many sub-domains",
      detail: "Long chains like secure.account.example.site.top can push the real domain out of view on small screens.",
      weight: 10,
    });
  }

  if (!isIPv4 && !isIPv6) {
    const registrable = registrableDomain(host);
    const hostPart = labels.slice(0, -1).join(".");
    const normalized = deLeet(hostPart);
    const tokens = normalized.split(/[.-]/);
    // Short brand names ("sbi") must start or end a label, so "taxis" never matches "axis".
    const brand = BRANDS.find((b) =>
      b.length <= 4 ? tokens.some((t) => t.startsWith(b) || t.endsWith(b)) : normalized.includes(b),
    );
    if (brand) {
      const officialLike = registrable.startsWith(`${brand}.`) || OFFICIAL_DOMAINS.has(registrable) || OFFICIAL_DOMAINS.has(host);
      if (!officialLike) {
        const substituted = !hostPart.includes(brand);
        findings.push({
          id: "lookalike-brand",
          label: "Brand name inside a different domain",
          detail: substituted
            ? `The address imitates “${brand}” using look-alike characters, but the real domain is ${registrable}.`
            : `The address mentions “${brand}”, but the actual domain is ${registrable}. Anyone can register a name containing a brand.`,
          weight: 20,
        });
      }
    }

    const freeHost = FREE_HOST_SUFFIXES.find((suffix) => host === suffix || host.endsWith(`.${suffix}`));
    if (freeHost) {
      findings.push({
        id: "free-hosting",
        label: "Free website or redirect service",
        detail: `The link is hosted on ${freeHost}, a service anyone can use to set up a page in minutes. Banks, couriers and government agencies use their own domains.`,
        weight: 12,
      });
    }

    const keyword = DECEPTIVE_KEYWORDS.find((k) => hostPart.includes(k));
    if (keyword) {
      findings.push({
        id: "deceptive-keywords",
        label: "Reassuring words in the domain",
        detail: `Words like “${keyword}” in a domain name are easy for anyone to register and do not make a site official.`,
        weight: 10,
      });
    }

    if (UNCOMMON_TLDS.has(tld)) {
      findings.push({
        id: "uncommon-tld",
        label: `Less common ending (.${tld})`,
        detail: "This ending is cheap and less commonly used by established organizations. Many legitimate sites use it too.",
        weight: 8,
      });
    }
  }

  if (raw.length > 100) {
    findings.push({
      id: "very-long",
      label: "Very long link",
      detail: "Very long links can hide the important part of the address.",
      weight: 6,
    });
  }

  return { host, findings };
}

export function analyzeUrls(text: string): UrlReport[] {
  return extractUrlCandidates(text).map((c) => ({ ...c, ...inspectUrl(c.raw) }));
}

/**
 * Combined weight for all URL findings in a message. The strongest finding
 * counts in full; others add 30% each. Capped so links alone cannot dominate.
 */
export function urlRiskWeight(reports: UrlReport[]): number {
  const weights = reports.flatMap((r) => r.findings.map((f) => f.weight)).sort((a, b) => b - a);
  if (weights.length === 0) return 0;
  const [top, ...rest] = weights;
  return Math.min(30, Math.round(top + rest.reduce((sum, w) => sum + w * 0.3, 0)));
}
