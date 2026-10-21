import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { StubPage } from "@/app/(mainapp)/_components/stub-page";

export default function BookingsPage() {
  return (
    <RequireAdmin>
      <StubPage
        title="Bookings"
        description="Review customer bookings — confirm, complete, cancel, and record counter payments."
        endpoints={[
          "GET        /api/v1/bookings?status=&gameId=&from=&to=",
          "POST       /api/v1/bookings   (checkout or pay-at-centre)",
          "GET        /api/v1/bookings/availability?gameId=&date=",
          "POST       /api/v1/bookings/:id/cancel",
          "PATCH      /api/v1/bookings/:id/status   (admin)",
        ]}
      />
    </RequireAdmin>
  );
}
