import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FavoriteRecipe } from "@/lib/favorites";
import { readFavorites, toggleFavoriteApi } from "@/lib/favorites";

type FavoritesState = {
  items: FavoriteRecipe[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: FavoritesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchFavorites = createAsyncThunk("favorites/fetch", async () => {
  return readFavorites();
});

export const toggleFavorite = createAsyncThunk(
  "favorites/toggle",
  async (recipe: FavoriteRecipe) => {
    await toggleFavoriteApi(recipe);
    return recipe;
  }
);

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Could not load favorites.";
      })
      .addCase(toggleFavorite.pending, (state, action) => {
        const recipe = action.meta.arg;
        const exists = state.items.some((r) => r.id === recipe.id);
        if (exists) {
          state.items = state.items.filter((r) => r.id !== recipe.id);
        } else {
          state.items.unshift(recipe);
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        // Rollback optimistic update
        const recipe = action.meta.arg;
        const exists = state.items.some((r) => r.id === recipe.id);
        if (exists) {
          state.items = state.items.filter((r) => r.id !== recipe.id);
        } else {
          state.items.unshift(recipe);
        }
        state.error = action.error.message || "Failed to toggle favorite.";
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
