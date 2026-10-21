import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { StubPage } from "@/app/(mainapp)/_components/stub-page";

export default function GamesPage() {
  return (
    <RequireAdmin>
      <StubPage
        title="Games"
        description="Manage the bookable games catalog — pricing, capacity, and availability status."
        endpoints={[
          "GET/POST   /api/v1/games",
          "GET/PATCH/DELETE /api/v1/games/:id",
          "GET        /api/v1/games/manage   (all statuses)",
          "GET        /api/v1/games/categories",
        ]}
      />
    </RequireAdmin>
  );
}
