import type { AppliedRecipeFilters, Recipe, RecipeDetails, Video } from "@/types";
import { MOCK_RECIPES, MOCK_RECIPE_DETAILS, MOCK_VIDEOS } from "./mockData";

type RecipeResponse = { recipes: Recipe[]; applied: AppliedRecipeFilters | null };

const DEFAULT_RECIPE_COUNT = 20;
const DEFAULT_VIDEO_COUNT = 20;

const mapDietaryPreferenceToDietParam = (dietaryPreference?: string) => {
  const value = typeof dietaryPreference === "string" ? dietaryPreference.trim() : "";
  if (!value || value === "No restrictions") return null;
  if (value === "Gluten-free") return "gluten free";
  if (value === "Keto") return "ketogenic";
  if (value === "Pescatarian") return "pescetarian";
  if (value === "Vegetarian") return "vegetarian";
  if (value === "Vegan") return "vegan";
  return null;
};

const chooseTuningFromGoals = (goals?: string[]) => {
  const normalized = Array.isArray(goals)
    ? goals
        .filter((g): g is string => typeof g === "string")
        .map((g) => g.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (
    normalized.includes("eat healthier") ||
    normalized.includes("lose weight") ||
    normalized.includes("gain muscle")
  ) {
    return { sort: "healthiness" as const };
  }
  if (normalized.includes("save money")) return { sort: "price" as const };
  if (normalized.includes("quick meals")) return { maxReadyTime: 30 };
  return {};
};

const normalizeIngredients = (ingredients: string[]) =>
  Array.from(new Set(ingredients.map((name) => name.trim()).filter(Boolean)));

export const getRecipesByIngredients = async (
  includeIngredients: string[],
  intolerances: string[],
  excludeIngredients: string[],
  opts?: { dietaryPreference?: string; goals?: string[] },
): Promise<RecipeResponse> => {
  const normalizedInclude = normalizeIngredients(includeIngredients);
  const normalizedIntolerances = normalizeIngredients(intolerances);
  const normalizedExclude = normalizeIngredients(excludeIngredients);

  if (normalizedInclude.length === 0) return { recipes: [], applied: null };

  const diet = mapDietaryPreferenceToDietParam(opts?.dietaryPreference);
  const tuning = chooseTuningFromGoals(opts?.goals);

  try {
    const res = await fetch("/api/recipes/spoonacular", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ingredients: normalizedInclude,
        intolerances: normalizedIntolerances,
        excludeIngredients: normalizedExclude,
        diet,
        ...tuning,
        number: DEFAULT_RECIPE_COUNT,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      recipes?: unknown;
      applied?: unknown;
      error?: unknown;
    };

    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : `Recipes API failed (${res.status}).`);
    }

    return {
      recipes: Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : [],
      applied: (data.applied ?? null) as AppliedRecipeFilters | null,
    };
  } catch (error) {
    console.error("Recipes: proxy error:", error);
    return {
      recipes: MOCK_RECIPES,
      applied: {
        endpoint: "/recipes/complexSearch",
        originalIngredients: normalizedInclude,
        includeIngredients: normalizedInclude,
        filteredOutIngredients: [],
        number: DEFAULT_RECIPE_COUNT,
        ignorePantry: true,
        ranking: 1,
        addRecipeInformation: true,
        fillIngredients: true,
        diet,
        intolerances: normalizedIntolerances,
        excludeIngredients: normalizedExclude,
        tuning,
      },
    };
  }
};

export const searchFoodVideos = async (query: string): Promise<{ videos: Video[] }> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return { videos: [] };

  try {
    const url = new URL("/api/spoonacular/food/videos/search", window.location.origin);
    url.searchParams.set("query", normalizedQuery);
    url.searchParams.set("number", String(DEFAULT_VIDEO_COUNT));
    const res = await fetch(url.toString(), { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as { videos?: unknown; error?: unknown };
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `Videos API failed (${res.status}).`);
    return { videos: Array.isArray(data.videos) ? (data.videos as Video[]) : [] };
  } catch (error) {
    console.error("Videos: proxy error:", error);
    return { videos: MOCK_VIDEOS };
  }
};

export const getRecipeInformation = async (id: number): Promise<RecipeDetails> => {
  try {
    const res = await fetch(`/api/spoonacular/recipes/${id}/information`, { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as RecipeDetails & { error?: unknown };
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `Details API failed (${res.status}).`);
    return data;
  } catch (error) {
    console.error("Details: proxy error:", error);
    return { ...MOCK_RECIPE_DETAILS, id };
  }
};
