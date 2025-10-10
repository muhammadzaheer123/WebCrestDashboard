import ipaddr from "ipaddr.js";
import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  const xri = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const forwarded = req.headers.get("forwarded");

  console.log("🌐 IP Detection Headers:", {
    "x-forwarded-for": xff,
    "x-real-ip": xri,
    "cf-connecting-ip": cfConnectingIp,
    forwarded: forwarded,
  });

  const fromXff = xff?.split(",")?.map((s) => s.trim())?.[0];
  const ip = fromXff ?? cfConnectingIp ?? xri ?? "unknown";

  console.log("🔍 Detected IP:", ip);
  return ip;
}

export function isOfficeNetwork(ipStr: string): boolean {
  const ALLOWED_IPS = (process.env.ALLOWED_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log("📋 Checking IP against allowed list:", {
    ip: ipStr,
    allowedIPs: ALLOWED_IPS,
  });

  return isIpAllowed(ipStr, ALLOWED_IPS);
}

export function isIpAllowed(ipStr: string, allowList: string[]): boolean {
  if (!ipStr || ipStr === "unknown") {
    console.log("❌ Invalid IP:", ipStr);
    return false;
  }

  try {
    let ip: any = ipaddr.parse(ipStr);
    console.log("🔬 Parsed IP:", {
      original: ipStr,
      parsed: ip.toString(),
      kind: ip.kind(),
    });

    if (ip.kind() === "ipv6" && ip.isIPv4MappedAddress?.()) {
      ip = ip.toIPv4Address();
      console.log("🔄 Converted to IPv4:", ip.toString());
    }

    const result = allowList.some((entry) => {
      console.log("🔍 Checking against rule:", entry);

      const [addr, range] = entry.includes("/")
        ? entry.split("/")
        : [entry, ip.kind() === "ipv6" ? "128" : "32"];

      const net = ipaddr.parse(addr);
      const prefixLength = parseInt(range);

      let probe: any = ip;
      if (probe.kind() === "ipv6" && probe.isIPv4MappedAddress?.()) {
        probe = probe.toIPv4Address();
      }

      if (probe.kind() !== net.kind()) {
        console.log("❌ IP kind mismatch:", {
          probe: probe.kind(),
          net: net.kind(),
        });
        return false;
      }

      const matches = probe.match(net, prefixLength);
      console.log("🎯 Match result:", { rule: entry, matches });
      return matches;
    });

    console.log("📊 Final IP check result:", result);
    return result;
  } catch (error) {
    console.error("💥 IP parsing error:", error);
    return false;
  }
}
