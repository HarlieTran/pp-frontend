import type { Recipe } from "@/types";

export type FavoriteRecipe = Pick<Recipe, "id" | "title" | "image" | "imageType">;

const safeReadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getIdentity = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown> | null) : null;
    const id = typeof parsed?.id === "string" ? parsed.id : "";
    const email = typeof parsed?.email === "string" ? parsed.email : "";
    return id || email || "anonymous";
  } catch {
    return "anonymous";
  }
};

const storageKeyForIdentity = (identity: string) => `pp_favorites_${identity}`;

const normalizeFavorite = (value: unknown): FavoriteRecipe | null => {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<FavoriteRecipe>;
  if (typeof v.id !== "number") return null;
  if (typeof v.title !== "string") return null;
  if (typeof v.image !== "string") return null;
  if (typeof v.imageType !== "string") return null;
  return { id: v.id, title: v.title, image: v.image, imageType: v.imageType };
};

export const readFavorites = (): FavoriteRecipe[] => {
  const identity = getIdentity();
  const raw = safeReadJson<unknown[]>(storageKeyForIdentity(identity), []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeFavorite).filter((x): x is FavoriteRecipe => Boolean(x));
};

export const writeFavorites = (items: FavoriteRecipe[]) => {
  const identity = getIdentity();
  localStorage.setItem(storageKeyForIdentity(identity), JSON.stringify(items));
  return items;
};

export const isFavorite = (favorites: FavoriteRecipe[], recipeId: number) =>
  favorites.some((r) => r.id === recipeId);

export const toggleFavorite = (favorites: FavoriteRecipe[], recipe: FavoriteRecipe) => {
  const exists = favorites.some((r) => r.id === recipe.id);
  const next = exists ? favorites.filter((r) => r.id !== recipe.id) : [recipe, ...favorites];
  writeFavorites(next);
  return next;
};

