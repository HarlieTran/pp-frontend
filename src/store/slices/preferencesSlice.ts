import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiGet } from "@/lib/api";

type Flavor = "Spicy" | "Sweet" | "Savory" | "Tangy" | "Mild";
type Diet = "No Restrictions" | "Vegetarian" | "Vegan" | "Pescatarian" | "Keto" | "Halal" | "Gluten-Free";

type Onboarding = {
  dietaryPreference: Diet;
  allergies: string[];
  customAvoid: string[];
  taste: { flavors: Flavor[]; spiceLevel: number };
  goals: string[];
};

type PreferencesState = {
  onboarding: Onboarding | null;
  onboardingCompleted: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: PreferencesState = {
  onboarding: null,
  onboardingCompleted: false,
  status: "idle",
  error: null,
};

export const fetchPreferences = createAsyncThunk("preferences/fetch", async () => {
  const data = await apiGet("/me/profile");
  
  const dietType = Array.isArray(data.preferenceProfile?.dietSignals?.dietType) && data.preferenceProfile.dietSignals.dietType.length > 0 ? data.preferenceProfile.dietSignals.dietType[0] : "No Restrictions";
  const allergies = Array.isArray(data.preferenceProfile?.dietSignals?.allergies) ? data.preferenceProfile.dietSignals.allergies : [];
  const customAvoid = typeof data.preferenceProfile?.dislikes?.csv === "string" && data.preferenceProfile.dislikes.csv ? data.preferenceProfile.dislikes.csv.split(", ").filter(Boolean) : [];
  const flavors = typeof data.preferenceProfile?.likes?.csv === "string" && data.preferenceProfile.likes.csv ? data.preferenceProfile.likes.csv.split(", ").filter(Boolean) : [];
  const goals = typeof data.preferenceProfile?.dietSignals?.notes === "string" && data.preferenceProfile.dietSignals.notes ? data.preferenceProfile.dietSignals.notes.split(", ").filter(Boolean) : [];

  const onboarding: Onboarding = {
    dietaryPreference: dietType as Diet,
    allergies,
    customAvoid,
    taste: {
      flavors: flavors as Flavor[],
      spiceLevel: 2 // We don't store spiceLevel in the backend yet, default to 2
    },
    goals
  };

  return {
    onboardingCompleted: data.onboardingCompleted === true,
    onboarding,
  };
});

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setPreferences: (state, action: { payload: any }) => {
      const data = action.payload;
      const dietType = Array.isArray(data.dietType) && data.dietType.length > 0 ? data.dietType[0] : "No Restrictions";
      const allergies = Array.isArray(data.allergies) ? data.allergies : [];
      const customAvoid = typeof data.disliked === "string" && data.disliked ? data.disliked.split(", ") : [];
      const flavors = typeof data.likes === "string" && data.likes ? data.likes.split(", ") : [];
      const goals = typeof data.notes === "string" && data.notes ? data.notes.split(", ") : [];

      state.onboarding = {
        dietaryPreference: dietType as Diet,
        allergies,
        customAvoid,
        taste: { flavors: flavors as Flavor[], spiceLevel: 2 },
        goals
      };
      state.onboardingCompleted = data.onboardingCompleted === true;
      state.status = "succeeded";
      state.error = null;
    },
    clearPreferences: (state) => {
      state.onboarding = null;
      state.onboardingCompleted = false;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPreferences.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.onboarding = action.payload.onboarding;
        state.onboardingCompleted = action.payload.onboardingCompleted;
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Could not load preferences.";
      });
  },
});

export const { setPreferences, clearPreferences } = preferencesSlice.actions;
export default preferencesSlice.reducer;
