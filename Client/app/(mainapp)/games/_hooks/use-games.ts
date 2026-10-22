import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  gamesApi,
  GAMES_LIST_KEY,
  GAME_DETAIL_KEY,
  GAME_CATEGORIES_KEY,
  PUBLIC_GAMES_KEY,
  type ListGamesParams,
  type CreateGameInput,
  type UpdateGameInput,
} from "@/api/games.api";

/** Public storefront catalog — ACTIVE games only. */
export function usePublicGames(
  params: ListGamesParams = { limit: 100 },
  enabled = true
) {
  return useQuery({
    queryKey: [...PUBLIC_GAMES_KEY, params],
    queryFn: () => gamesApi.listPublic(params),
    enabled,
  });
}

/** Admin catalog — all statuses. */
export function useGames(
  params: ListGamesParams = { limit: 100 },
  enabled = true
) {
  return useQuery({
    queryKey: GAMES_LIST_KEY,
    queryFn: () => gamesApi.listAdmin(params),
    enabled,
  });
}

export function useGame(id: string) {
  return useQuery({
    queryKey: [...GAME_DETAIL_KEY, id],
    queryFn: () => gamesApi.getAdmin(id),
    enabled: !!id,
  });
}

export function useGameCategories() {
  return useQuery({
    queryKey: GAME_CATEGORIES_KEY,
    queryFn: gamesApi.categories,
    staleTime: 60_000,
  });
}

export function useCreateGame(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGameInput) => gamesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMES_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: GAME_CATEGORIES_KEY });
      onSuccess?.();
    },
  });
}

export function useUpdateGame(id: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGameInput) => gamesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMES_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: GAME_CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: [...GAME_DETAIL_KEY, id] });
      onSuccess?.();
    },
  });
}

export function useDeleteGame(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gamesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMES_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: GAME_CATEGORIES_KEY });
      onSuccess?.();
    },
  });
}
