/**
 * Breaks a link into labelled parts so people can see who actually owns it,
 * and pinpoints characters that only look like familiar letters.
 * String processing only: nothing is fetched.
 */
import { BROKEN_SCHEME, parseUrl, registrableDomain } from "./urls";

export type PartKind = "scheme" | "userinfo" | "subdomain" | "domain" | "port" | "path";

export interface UrlPart {
  kind: PartKind;
  text: string;
}

export interface LookalikeChar {
  char: string;
  codePoint: string;
  script: string;
  looksLike: string | null;
}

export interface UrlAnatomy {
  parts: UrlPart[];
  /** The registrable domain, e.g. "example.co.uk": who controls the link. */
  owner: string;
  /** The owner as people see it (punycode decoded). */
  ownerShown: string;
  /** Host as people see it (punycode decoded), when different from the raw host. */
  displayHost: string | null;
  lookalikes: LookalikeChar[];
}

/** Latin letters that common non-Latin characters imitate. */
const CONFUSABLES: Record<string, string> = {
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j", ѕ: "s", һ: "h", ԁ: "d", ӏ: "l", ԛ: "q", ԝ: "w",
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", Х: "X",
  ο: "o", α: "a", ν: "v", ρ: "p", ι: "i", κ: "k", τ: "t", υ: "u", χ: "x", ϲ: "c",
  Ο: "O", Α: "A", Β: "B", Ε: "E", Ζ: "Z", Η: "H", Ι: "I", Κ: "K", Μ: "M", Ν: "N", Ρ: "P", Τ: "T", Υ: "Y", Χ: "X",
};

function scriptOf(ch: string): string {
  if (/\p{Script=Cyrillic}/u.test(ch)) return "Cyrillic";
  if (/\p{Script=Greek}/u.test(ch)) return "Greek";
  if (/\p{Script=Armenian}/u.test(ch)) return "Armenian";
  if (/\p{Script=Devanagari}/u.test(ch)) return "Devanagari";
  if (/\p{Script=Latin}/u.test(ch)) return "Latin (accented)";
  return "Other";
}

/** RFC 3492 punycode decoder for a single label (without the "xn--" prefix). */
export function decodePunycode(input: string): string {
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  const output: number[] = [];
  let n = 128;
  let i = 0;
  let bias = 72;
  const basic = input.lastIndexOf("-");
  for (let j = 0; j < Math.max(0, basic); j++) output.push(input.charCodeAt(j));
  const adapt = (delta: number, numPoints: number, first: boolean) => {
    delta = first ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    let k = 0;
    while (delta > ((base - tMin) * tMax) >> 1) {
      delta = Math.floor(delta / (base - tMin));
      k += base;
    }
    return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
  };
  for (let index = basic > 0 ? basic + 1 : 0; index < input.length; ) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (index >= input.length) throw new Error("Invalid punycode");
      const c = input.charCodeAt(index++);
      const digit = c >= 48 && c <= 57 ? c - 22 : c >= 65 && c <= 90 ? c - 65 : c >= 97 && c <= 122 ? c - 97 : base;
      if (digit >= base) throw new Error("Invalid punycode");
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    bias = adapt(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

export function toUnicodeHost(host: string): string {
  return host
    .split(".")
    .map((label) => {
      if (!label.startsWith("xn--")) return label;
      try {
        return decodePunycode(label.slice(4));
      } catch {
        return label;
      }
    })
    .join(".");
}

export function urlAnatomy(raw: string): UrlAnatomy | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  const unicodeHost = toUnicodeHost(host);
  const owner = isIp ? host : registrableDomain(host);
  const ownerShown = isIp ? host : registrableDomain(unicodeHost);
  const sub = isIp ? "" : unicodeHost.slice(0, Math.max(0, unicodeHost.length - ownerShown.length)).replace(/\.$/, "");

  const typedScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || BROKEN_SCHEME.test(raw) ? `${url.protocol}//` : "";
  const parts: UrlPart[] = [];
  if (typedScheme) parts.push({ kind: "scheme", text: typedScheme });
  if (url.username || url.password) parts.push({ kind: "userinfo", text: `${decodeURIComponent(url.username)}${url.password ? ":•••" : ""}@` });
  if (sub) parts.push({ kind: "subdomain", text: `${sub}.` });
  parts.push({ kind: "domain", text: ownerShown });
  if (url.port) parts.push({ kind: "port", text: `:${url.port}` });
  const rest = `${url.pathname === "/" && !/\/$/.test(raw) ? "" : url.pathname}${url.search}${url.hash}`;
  if (rest) parts.push({ kind: "path", text: rest });

  const seen = new Set<string>();
  const lookalikes: LookalikeChar[] = [];
  for (const ch of unicodeHost) {
    if (ch.charCodeAt(0) < 128 || seen.has(ch)) continue;
    seen.add(ch);
    lookalikes.push({
      char: ch,
      codePoint: `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`,
      script: scriptOf(ch),
      looksLike: CONFUSABLES[ch] ?? null,
    });
  }

  return { parts, owner, ownerShown, displayHost: unicodeHost !== host ? unicodeHost : null, lookalikes };
}
