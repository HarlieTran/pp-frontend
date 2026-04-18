import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MealPlanRecipe } from '@/types';
import { readMealPlannerState, writeMealPlannerState } from '@/lib/mealPlannerStorage';

interface MealPlannerState {
  plannedRecipes: MealPlanRecipe[];
  shoppingListText: string;
}

const initialState: MealPlannerState = {
  plannedRecipes: [],
  shoppingListText: '',
};

export const fetchMealPlanner = createAsyncThunk("mealPlanner/fetch", async () => {
  return readMealPlannerState();
});

export const mealPlannerSlice = createSlice({
  name: 'mealPlanner',
  initialState,
  reducers: {
    addRecipeToPlan: (state, action: PayloadAction<MealPlanRecipe>) => {
      const exists = state.plannedRecipes.find(r => r.id === action.payload.id);
      if (!exists) {
        state.plannedRecipes.push(action.payload);
      }
      writeMealPlannerState({ plannedRecipes: state.plannedRecipes, shoppingListText: state.shoppingListText });
    },
    removeRecipeFromPlan: (state, action: PayloadAction<string>) => {
      state.plannedRecipes = state.plannedRecipes.filter(r => r.id !== action.payload);
      writeMealPlannerState({ plannedRecipes: state.plannedRecipes, shoppingListText: state.shoppingListText });
    },
    clearPlan: (state) => {
      state.plannedRecipes = [];
      state.shoppingListText = '';
      writeMealPlannerState({ plannedRecipes: state.plannedRecipes, shoppingListText: state.shoppingListText });
    },
    setShoppingListText: (state, action: PayloadAction<string>) => {
      state.shoppingListText = action.payload;
      writeMealPlannerState({ plannedRecipes: state.plannedRecipes, shoppingListText: state.shoppingListText });
    },
    resetMealPlanner: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMealPlanner.fulfilled, (state, action) => {
      state.plannedRecipes = action.payload.plannedRecipes;
      state.shoppingListText = action.payload.shoppingListText;
    });
  },
});

export const { addRecipeToPlan, removeRecipeFromPlan, clearPlan, setShoppingListText, resetMealPlanner } = mealPlannerSlice.actions;

export default mealPlannerSlice.reducer;
