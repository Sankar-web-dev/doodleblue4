import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { StubPage } from "@/app/(mainapp)/_components/stub-page";

export default function PlansPage() {
  return (
    <RequireAdmin>
      <StubPage
        title="Membership Plans"
        description="Manage membership tiers — discounts, monthly/yearly pricing, and Stripe Price IDs."
        endpoints={[
          "GET        /api/v1/membership-plans   (public, active only)",
          "GET/POST   /api/v1/membership-plans/manage",
          "GET/PATCH/DELETE /api/v1/membership-plans/:id",
        ]}
      />
    </RequireAdmin>
  );
}
