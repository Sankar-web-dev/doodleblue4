import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { StubPage } from "@/app/(mainapp)/_components/stub-page";

export default function PaymentsPage() {
  return (
    <RequireAdmin>
      <StubPage
        title="Payments"
        description="Payment history across bookings and memberships."
        endpoints={[
          "GET        /api/v1/payments?status=&type=&from=&to=",
          "GET        /api/v1/payments/:id",
        ]}
      />
    </RequireAdmin>
  );
}
