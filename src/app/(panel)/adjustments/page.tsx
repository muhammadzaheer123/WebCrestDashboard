import AdjustmentsShell from "./AdjustmentsShell";
import { PolicyProvider } from "./PolicyProvider";

export default function Page() {
  return (
    <PolicyProvider>
      <AdjustmentsShell />
    </PolicyProvider>
  );
}
