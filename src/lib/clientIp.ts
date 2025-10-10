import ipaddr from "ipaddr.js";
import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  const xri = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  const fromXff = xff?.split(",")?.map((s) => s.trim())?.[0];
  return fromXff ?? cfConnectingIp ?? xri ?? "unknown";
}

export function isIpAllowed(ipStr: string, allowList: string[]): boolean {
  if (!ipStr || ipStr === "unknown") return false;

  try {
    let ip: any = ipaddr.parse(ipStr);

    if (ip.kind() === "ipv6" && ip.isIPv4MappedAddress?.()) {
      ip = ip.toIPv4Address();
    }

    return allowList.some((entry) => {
      const [addr, range] = entry.includes("/")
        ? entry.split("/")
        : [entry, ip.kind() === "ipv6" ? "128" : "32"];

      const net = ipaddr.parse(addr);
      const prefixLength = parseInt(range);

      let probe: any = ip;
      if (probe.kind() === "ipv6" && probe.isIPv4MappedAddress?.()) {
        probe = probe.toIPv4Address();
      }

      if (probe.kind() !== net.kind()) return false;
      return probe.match(net, prefixLength);
    });
  } catch (error) {
    console.error("IP parsing error:", error);
    return false;
  }
}
