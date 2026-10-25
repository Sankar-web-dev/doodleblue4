import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { AdminPayments } from "./_components/admin-payments";

export default function PaymentsPage() {
  return (
    <RequireAdmin>
      <AdminPayments />
    </RequireAdmin>
  );
}
