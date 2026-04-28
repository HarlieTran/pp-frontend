import { apiGet, apiPost, apiDelete } from "./api";
import type { MealPlanRecipe } from "@/types";

export const fetchMealPlanFromApi = async (): Promise<MealPlanRecipe[]> => {
  return await apiGet("/meal-plan");
};

export const addRecipeToMealPlanApi = async (recipeId: number | string, date?: string): Promise<void> => {
  await apiPost(`/meal-plan/${recipeId}`, { date });
};

export const addAiRecipeToMealPlanApi = async (recipe: any, date?: string): Promise<void> => {
  await apiPost("/meal-plan/ai", { ...recipe, date });
};

export const removeRecipeFromMealPlanApi = async (recipeId: number | string): Promise<void> => {
  await apiDelete(`/meal-plan/${recipeId}`);
};

export const clearMealPlanApi = async (): Promise<void> => {
  await apiDelete("/meal-plan");
};
