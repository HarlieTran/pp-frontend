import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiGet, apiPost } from "@/lib/api";
import type { Recipe, AiRecipe, RecipeDetails, AppliedRecipeFilters } from "@/types";
import type { RootState } from "../index";
import { clearPreferences, fetchPreferences, setPreferences } from "./preferencesSlice";

interface RecipesState {
  items: Recipe[];
  appliedFilters: AppliedRecipeFilters | null;
  aiRecipes: AiRecipe[];
  selectedRecipeDetails: RecipeDetails | null;
  detailsStatus: "idle" | "loading" | "succeeded" | "failed";
  status: "idle" | "loading" | "succeeded" | "failed";
  aiStatus: "idle" | "loading" | "succeeded" | "failed";
  lastRecipeSignature: string;
  lastAiSignature: string;
  error: string | null;
  aiError: string | null;
}

const initialState: RecipesState = {
  items: [],
  appliedFilters: null,
  aiRecipes: [],
  selectedRecipeDetails: null,
  detailsStatus: "idle",
  status: "idle",
  aiStatus: "idle",
  lastRecipeSignature: "",
  lastAiSignature: "",
  error: null,
  aiError: null,
};

const createIngredientSignature = (ingredients: string[]) =>
  ingredients
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .join(",");

export const fetchRecipes = createAsyncThunk(
  "recipes/fetchByIngredients",
  async (_, { getState }) => {
    const state = getState() as RootState;
    
    const sortedIngredients = [...state.ingredients.items].sort((a, b) => {
      const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return aExpiry - bExpiry;
    });

    const includeIngredients = sortedIngredients.map((i) => i.name);
    const signature = createIngredientSignature(includeIngredients);
    
    // Backend will use the authenticated user's pantry implicitly and filter by their preferences
    const result = await apiPost("/recipes/suggestions", { limit: 12 });
    
    return { recipes: result.recipes, applied: null, signature };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (state.recipes.status === "loading") return false;
      const nextSignature = createIngredientSignature(
        state.ingredients.items.map((i) => i.name),
      );
      return nextSignature !== state.recipes.lastRecipeSignature;
    },
  },
);

export const fetchAiRecipes = createAsyncThunk(
  "recipes/fetchAiRecipes",
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const ingredients = state.ingredients.items.map((i) => ({
      name: i.name,
      quantity: i.quantity || "unknown"
    }));

    const data = await apiPost("/recipes/generate-list", { ingredients });
    const signature = createIngredientSignature(ingredients.map(i => i.name));
    
    data.recipes.forEach((r: any) => {
      dispatch(generateAiRecipeImage({ title: r.title, description: r.finalDish || r.summary || "" }));
    });
    
    return { recipes: data.recipes, signature };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (state.recipes.aiStatus === "loading") return false;
      const nextSignature = createIngredientSignature(
        state.ingredients.items.map((i) => i.name)
      );
      return nextSignature !== state.recipes.lastAiSignature;
    },
  },
);

export const generateAiRecipeImage = createAsyncThunk(
  "recipes/generateAiRecipeImage",
  async ({ title, description }: { title: string; description: string }) => {
    const data = await apiPost("/recipes/generate-image", { title, description });
    return { title, imageUrl: data.imageUrl };
  }
);

export const fetchRecipeDetails = createAsyncThunk(
  "recipes/fetchDetails",
  async (id: number) => {
    return await apiGet(`/recipes/${id}`);
  },
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    clearSelectedRecipe: (state) => {
      state.selectedRecipeDetails = null;
      state.detailsStatus = "idle";
    },
    resetAiRecipes: (state) => {
       state.lastAiSignature = "";
       state.aiRecipes = [];
       state.aiStatus = "idle";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPreferences.fulfilled, (state) => {
        state.lastRecipeSignature = "";
      })
      .addCase(setPreferences, (state) => {
        state.lastRecipeSignature = "";
      })
      .addCase(clearPreferences, (state) => {
        state.lastRecipeSignature = "";
      })
      .addCase(fetchRecipes.pending, (state) => {
        state.status = "loading";
        state.items = [];
        state.appliedFilters = null;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.recipes;
        state.appliedFilters = action.payload.applied;
        state.lastRecipeSignature = action.payload.signature;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch recipes";
      })
      .addCase(fetchAiRecipes.pending, (state) => {
        state.aiStatus = "loading";
        state.aiError = null;
      })
      .addCase(fetchAiRecipes.fulfilled, (state, action) => {
        state.aiStatus = "succeeded";
        state.aiRecipes = action.payload.recipes;
        state.lastAiSignature = action.payload.signature;
      })
      .addCase(fetchAiRecipes.rejected, (state, action) => {
        state.aiStatus = "failed";
        state.aiError = action.error.message || "Failed to fetch AI recipes";
      })
      .addCase(generateAiRecipeImage.fulfilled, (state, action) => {
        const recipe = state.aiRecipes.find(r => r.title === action.payload.title);
        if (recipe && action.payload.imageUrl) {
          recipe.imageUrl = action.payload.imageUrl;
        }
      })
      .addCase(fetchRecipeDetails.pending, (state) => {
        state.detailsStatus = "loading";
      })
      .addCase(fetchRecipeDetails.fulfilled, (state, action) => {
        state.detailsStatus = "succeeded";
        state.selectedRecipeDetails = action.payload;
      })
      .addCase(fetchRecipeDetails.rejected, (state) => {
        state.detailsStatus = "failed";
      });
  },
});

export const { clearSelectedRecipe, resetAiRecipes } = recipesSlice.actions;
export default recipesSlice.reducer;
