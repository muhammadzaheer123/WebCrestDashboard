import AdminShell from "./ui/AdminShell";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
