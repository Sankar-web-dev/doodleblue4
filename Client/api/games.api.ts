import { api, PaginationMeta } from "@/lib/api";

export const GAMES_LIST_KEY = ["games", "manage"] as const;
export const GAME_DETAIL_KEY = ["games", "detail"] as const;
export const GAME_CATEGORIES_KEY = ["games", "categories"] as const;
export const PUBLIC_GAMES_KEY = ["games", "public"] as const;

export type GameStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  imageUrl: string | null;
  /** Decimal — arrives as string over JSON. */
  pricePerHour: string | number;
  minBookingMins: number;
  maxBookingMins: number;
  capacity: number;
  status: GameStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameInput {
  name: string;
  slug?: string;
  description?: string;
  category: string;
  imageUrl?: string;
  pricePerHour: number;
  minBookingMins?: number;
  maxBookingMins?: number;
  capacity?: number;
  status?: GameStatus;
  sortOrder?: number;
}

export type UpdateGameInput = Partial<Omit<CreateGameInput, "imageUrl">> & {
  imageUrl?: string | null;
};

export interface ListGamesParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function qs(params: ListGamesParams) {
  const p = new URLSearchParams();
  if (params.category) p.set("category", params.category);
  if (params.search) p.set("search", params.search);
  if (params.page) p.set("page", String(params.page));
  if (params.limit) p.set("limit", String(params.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const gamesApi = {
  /** Public storefront catalog — ACTIVE games only. */
  listPublic: (params: ListGamesParams = {}) =>
    api.getWithMeta<Game[], PaginationMeta>(
      `/api/v1/games${qs(params)}`
    ),

  /** Admin catalog — all statuses. */
  listAdmin: (params: ListGamesParams = {}) =>
    api.getWithMeta<Game[], PaginationMeta>(
      `/api/v1/games/manage${qs(params)}`
    ),

  getAdmin: (id: string) =>
    api.get<Game>(`/api/v1/games/manage/${id}`),

  create: (input: CreateGameInput) =>
    api.post<Game>("/api/v1/games", input),

  update: (id: string, input: UpdateGameInput) =>
    api.patch<Game>(`/api/v1/games/${id}`, input),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/games/${id}`),

  /** Distinct categories of active games (public endpoint). */
  categories: () => api.get<string[]>("/api/v1/games/categories"),

  /**
   * Upload a game image to database object storage. Returns a relative
   * `/api/v1/storage/<id>` URL — store it in `imageUrl`.
   */
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.postFormData<{
      id: string;
      filename: string;
      mimeType: string;
      size: number;
      url: string;
    }>("/api/v1/storage/upload", formData);
  },
};
