import type { Recipe } from "@/types";

export type FavoriteRecipe = Pick<Recipe, "id" | "title" | "image" | "imageType">;

import { apiGet, apiPost } from "@/lib/api";

export const readFavorites = async (): Promise<FavoriteRecipe[]> => {
  try {
    return await apiGet("/recipes/saved");
  } catch (error) {
    console.error("Failed to read favorites from API", error);
    return [];
  }
};

export const isFavorite = (favorites: FavoriteRecipe[], recipeId: number) =>
  favorites.some((r) => r.id === recipeId);

export const toggleFavoriteApi = async (recipe: FavoriteRecipe): Promise<{ saved: boolean }> => {
  return await apiPost(`/recipes/${recipe.id}/save`, {});
};

