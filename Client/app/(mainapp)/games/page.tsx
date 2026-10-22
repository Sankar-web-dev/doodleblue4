import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import GamesView from "./_components/games-view";

export default function GamesPage() {
  return (
    <RequireAdmin>
      <GamesView />
    </RequireAdmin>
  );
}
