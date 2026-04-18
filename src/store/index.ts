import { configureStore } from '@reduxjs/toolkit';
import ingredientsReducer from './slices/ingredientsSlice';
import recipesReducer from './slices/recipesSlice';
import preferencesReducer from './slices/preferencesSlice';
import mealPlannerReducer from './slices/mealPlannerSlice';
import favoritesReducer from './slices/favoritesSlice';

export const store = configureStore({
  reducer: {
    ingredients: ingredientsReducer,
    recipes: recipesReducer,
    preferences: preferencesReducer,
    mealPlanner: mealPlannerReducer,
    favorites: favoritesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
