import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import ReportsView from "./_components/reports-view";

export default function ReportsPage() {
  return (
    <RequireAdmin>
      <ReportsView />
    </RequireAdmin>
  );
}
