import { apiGet, apiPost, apiDelete } from "./api";
import type { MealPlanRecipe } from "@/types";

export const fetchMealPlanFromApi = async (): Promise<MealPlanRecipe[]> => {
  return await apiGet("/meal-plan");
};

export const addRecipeToMealPlanApi = async (recipeId: number | string): Promise<void> => {
  await apiPost(`/meal-plan/${recipeId}`, {});
};

export const addAiRecipeToMealPlanApi = async (recipe: any): Promise<void> => {
  await apiPost("/meal-plan/ai", recipe);
};

export const removeRecipeFromMealPlanApi = async (recipeId: number | string): Promise<void> => {
  await apiDelete(`/meal-plan/${recipeId}`);
};

export const clearMealPlanApi = async (): Promise<void> => {
  await apiDelete("/meal-plan");
};
