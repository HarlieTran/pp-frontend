import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FavoriteRecipe } from "@/lib/favorites";
import { readFavorites, toggleFavorite as toggleFavoriteStorage } from "@/lib/favorites";

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

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    toggleFavorite: (state, action: { payload: FavoriteRecipe }) => {
      state.items = toggleFavoriteStorage(state.items, action.payload);
      state.status = "succeeded";
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
      });
  },
});

export const { clearFavorites, toggleFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;

