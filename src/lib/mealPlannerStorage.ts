import type { MealPlanRecipe } from "@/types";

export type PersistedMealPlannerState = {
  plannedRecipes: MealPlanRecipe[];
  shoppingListText: string;
};

const safeReadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getIdentity = (): string | null => {
  try {
    const raw = localStorage.getItem("auth_user");
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown> | null) : null;
    const id = typeof parsed?.id === "string" ? parsed.id : "";
    const email = typeof parsed?.email === "string" ? parsed.email : "";
    const identity = id || email;
    return identity ? identity : null;
  } catch {
    return null;
  }
};

const storageKeyForIdentity = (identity: string) => `pp_meal_plan_${identity}`;

export const readMealPlannerState = (): PersistedMealPlannerState => {
  const identity = getIdentity();
  if (!identity) return { plannedRecipes: [], shoppingListText: "" };
  const raw = safeReadJson<Partial<PersistedMealPlannerState> | null>(storageKeyForIdentity(identity), null);
  return {
    plannedRecipes: Array.isArray(raw?.plannedRecipes) ? (raw?.plannedRecipes as MealPlanRecipe[]) : [],
    shoppingListText: typeof raw?.shoppingListText === "string" ? raw.shoppingListText : "",
  };
};

export const writeMealPlannerState = (state: PersistedMealPlannerState) => {
  const identity = getIdentity();
  if (!identity) return state;
  localStorage.setItem(storageKeyForIdentity(identity), JSON.stringify(state));
  return state;
};

