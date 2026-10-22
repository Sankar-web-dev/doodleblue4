import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { GameForm } from "../_components/game-form";

export default function NewGamePage() {
  return (
    <RequireAdmin message="Administrator access is required to manage games.">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Add game
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new bookable game — set pricing, capacity, and booking limits.
          </p>
        </div>
        <div className="max-w-3xl">
          <GameForm />
        </div>
      </div>
    </RequireAdmin>
  );
}
