"use client";

import { useAuthUser } from "@/lib/use-auth-user";
import { isAdmin } from "@/lib/permissions";

import GamesBrowseView from "./games-browse-view";
import GamesView from "./games-view";

/** Admin gets the management view; customers get the browse catalog. */
export function GamesRoleView() {
  const { user, isPending } = useAuthUser();

  if (isPending) return null;
  return isAdmin(user) ? <GamesView /> : <GamesBrowseView />;
}
