// import * as ipaddr from "ipaddr.js";

// const envBool = (v: string | undefined, def = false) =>
//   (v ?? (def ? "true" : "false")).toLowerCase() === "true";

// const TRUST_PROXY = (process.env.TRUST_PROXY || "none").toLowerCase(); // "cloudflare" | "nginx" | "vercel" | "none"
// const IP_DEBUG = envBool(process.env.IP_DEBUG);
// const ALLOW_LOCALHOST =
//   envBool(process.env.ALLOW_LOCALHOST) || process.env.NODE_ENV !== "production";

// function readHeader(headers: Headers, name: string) {
//   return headers.get(name) || "";
// }

// function pickClientIpFromHeaders(headers: Headers): string | null {
//   const cf = readHeader(headers, "cf-connecting-ip");
//   const xri = readHeader(headers, "x-real-ip");
//   const xff = readHeader(headers, "x-forwarded-for");

//   if (TRUST_PROXY === "cloudflare" && cf) return cf;

//   if (TRUST_PROXY === "nginx" || TRUST_PROXY === "vercel") {
//     if (xff) {
//       const first = xff
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean)[0];
//       if (first) return first;
//     }
//     if (xri) return xri;
//   }

//   if (xri) return xri;
//   if (cf) return cf;
//   if (xff) return xff.split(",")[0].trim();

//   return null;
// }

// function normalizeIp(ip: string | null): string | null {
//   if (!ip) return null;
//   let v = ip.trim();
//   if (v.startsWith("::ffff:")) v = v.slice(7); // IPv6-mapped IPv4
//   return v;
// }

// export function getClientIpFromHeaders(headers: Headers): string | null {
//   let ip = normalizeIp(pickClientIpFromHeaders(headers));
//   if (!ip && ALLOW_LOCALHOST) ip = "127.0.0.1";

//   if (IP_DEBUG) {
//     console.log("IP resolve", {
//       TRUST_PROXY,
//       cf: readHeader(headers, "cf-connecting-ip"),
//       xri: readHeader(headers, "x-real-ip"),
//       xff: readHeader(headers, "x-forwarded-for"),
//       chosen: ip,
//     });
//   }
//   return ip;
// }

// function ipInAllowlist(ipStr: string, allowList: string[]): boolean {
//   try {
//     let probe: ipaddr.IPv4 | ipaddr.IPv6 = ipaddr.parse(ipStr);
//     if (
//       probe.kind() === "ipv6" &&
//       (probe as ipaddr.IPv6).isIPv4MappedAddress()
//     ) {
//       probe = (probe as ipaddr.IPv6).toIPv4Address();
//     }
//     return allowList.some((entry) => {
//       const [addr, range] = entry.includes("/")
//         ? entry.split("/")
//         : [entry, probe.kind() === "ipv6" ? "128" : "32"];
//       let net: ipaddr.IPv4 | ipaddr.IPv6 = ipaddr.parse(addr);
//       if (net.kind() === "ipv6" && (net as ipaddr.IPv6).isIPv4MappedAddress()) {
//         net = (net as ipaddr.IPv6).toIPv4Address();
//       }
//       if (probe.kind() !== net.kind()) return false;
//       return (probe as any).match(net, parseInt(range, 10));
//     });
//   } catch {
//     return false;
//   }
// }

// export type OfficeGateResult = {
//   ok: boolean;
//   ip: string | null;
//   reason?: string;
//   ssid?: string;
// };

// export function ensureOfficeGate(headers: Headers): OfficeGateResult {
//   const ip = getClientIpFromHeaders(headers);
//   if (process.env.NODE_ENV === "development") {
//     console.log("🔓 Development mode - IP restriction disabled");
//     return { ok: true, ip };
//   }
//   // Dev convenience
//   if (ALLOW_LOCALHOST && (ip === "127.0.0.1" || ip === "::1")) {
//     return { ok: true, ip };
//   }

//   const allowList = (process.env.ALLOWED_PUBLIC_IPS || "")
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);

//   if (!ip) return { ok: false, ip: null, reason: "Unable to detect client IP" };
//   if (!allowList.length)
//     return { ok: false, ip, reason: "ALLOWED_PUBLIC_IPS is empty" };

//   if (!ipInAllowlist(ip, allowList)) {
//     return { ok: false, ip, reason: `IP ${ip} not in allowlist` };
//   }

//   const REQUIRE_WIFI_SSID = envBool(process.env.REQUIRE_WIFI_SSID);
//   if (REQUIRE_WIFI_SSID) {
//     const ssid = readHeader(headers, "x-ssid") || undefined;
//     const allowedSsids = (process.env.ALLOWED_WIFI_SSIDS || "")
//       .split(",")
//       .map((s) => s.trim())
//       .filter(Boolean);

//     if (!ssid)
//       return { ok: false, ip, reason: "Wi-Fi SSID header missing (x-ssid)" };
//     if (!allowedSsids.includes(ssid))
//       return { ok: false, ip, reason: `SSID ${ssid} not allowed`, ssid };
//     return { ok: true, ip, ssid };
//   }

//   return { ok: true, ip };
// }
