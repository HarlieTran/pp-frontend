import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MealPlanRecipe } from '@/types';
import { fetchMealPlanFromApi, addRecipeToMealPlanApi, removeRecipeFromMealPlanApi, clearMealPlanApi } from '@/lib/meal-plan';

interface MealPlannerState {
  plannedRecipes: MealPlanRecipe[];
  shoppingListText: string;
}

const initialState: MealPlannerState = {
  plannedRecipes: [],
  shoppingListText: '',
};

export const fetchMealPlanner = createAsyncThunk("mealPlanner/fetch", async () => {
  return await fetchMealPlanFromApi() as MealPlanRecipe[];
});

export const addRecipeToPlan = createAsyncThunk("mealPlanner/add", async (recipe: MealPlanRecipe) => {
  await addRecipeToMealPlanApi(recipe.id);
  return recipe;
});

export const removeRecipeFromPlan = createAsyncThunk("mealPlanner/remove", async (recipeId: string) => {
  await removeRecipeFromMealPlanApi(recipeId);
  return recipeId;
});

export const clearPlan = createAsyncThunk("mealPlanner/clear", async () => {
  await clearMealPlanApi();
});

export const mealPlannerSlice = createSlice({
  name: 'mealPlanner',
  initialState,
  reducers: {
    setShoppingListText: (state, action: PayloadAction<string>) => {
      state.shoppingListText = action.payload;
    },
    resetMealPlanner: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchMealPlanner.fulfilled, (state, action) => {
        state.plannedRecipes = action.payload;
      })
      // add
      .addCase(addRecipeToPlan.pending, (state, action) => {
        const exists = state.plannedRecipes.find(r => r.id === action.meta.arg.id);
        if (!exists) {
          state.plannedRecipes.push(action.meta.arg);
        }
      })
      .addCase(addRecipeToPlan.rejected, (state, action) => {
        state.plannedRecipes = state.plannedRecipes.filter(r => r.id !== action.meta.arg.id);
      })
      // remove
      .addCase(removeRecipeFromPlan.pending, (state, action) => {
        state.plannedRecipes = state.plannedRecipes.filter(r => r.id !== action.meta.arg);
      })
      .addCase(removeRecipeFromPlan.rejected, () => {
        // Rollback is harder here unless we have the full recipe, but re-fetching on error is safer
      })
      // clear
      .addCase(clearPlan.pending, (state) => {
        state.plannedRecipes = [];
      });
  },
});

export const { setShoppingListText, resetMealPlanner } = mealPlannerSlice.actions;

export default mealPlannerSlice.reducer;
