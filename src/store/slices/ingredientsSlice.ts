import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Ingredient } from '@/types';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface IngredientsState {
  items: Ingredient[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  saveError: string | null;
}

const initialState: IngredientsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
};

type AddIngredientPayload = {
  name: string;
  quantity?: string;
  unit?: string;
  expiryDate?: string;
  notes?: string;
  inFreezer?: boolean;
};

export const fetchPantry = createAsyncThunk("ingredients/fetchPantry", async () => {
  const data = await apiGet("/me/pantry");
  return (data.items || []).map((item: any) => ({
    ...item,
    name: item.rawName || item.canonicalName || "Unknown",
    quantity: String(item.quantity || "1"),
  })) as Ingredient[];
});

export const savePantry = createAsyncThunk("ingredients/savePantry", async () => {
  // savePantry was used in V2 to bulk save local state.
  // We now save immediately on add/remove, so this is a no-op to preserve UI compat.
  return [];
});

export const addIngredient = createAsyncThunk(
  "ingredients/addIngredient",
  async (payload: AddIngredientPayload) => {
    const data = await apiPost("/me/pantry", {
      rawName: payload.name.trim(),
      quantity: Number(payload.quantity) || 1,
      unit: payload.unit || "pcs",
      notes: payload.notes,
      expiryDate: payload.expiryDate,
    });
    return {
      ...data,
      name: data.rawName || data.canonicalName || payload.name,
      quantity: String(data.quantity || "1"),
    } as Ingredient;
  }
);

export const removeIngredient = createAsyncThunk(
  "ingredients/removeIngredient",
  async (id: string) => {
    await apiDelete(`/me/pantry/${id}`);
    return id;
  }
);

export const cookRecipeThunk = createAsyncThunk(
  "ingredients/cookRecipe",
  async (payload: { recipeId?: number; ingredients?: any[]; servingsUsed?: number }, { dispatch }) => {
    const data = await apiPost("/recipes/cook", payload);
    // Fetch fresh pantry state after cook deductions
    dispatch(fetchPantry());
    return data;
  }
);

export const categorizeIngredient = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  const categories = {
    "Produce": ["tomato", "potato", "carrot", "cucumber", "onion", "garlic", "apple", "banana", "broccoli", "pepper", "spinach", "lettuce", "strawberry", "radish", "eggplant", "salad", "celery", "mushroom", "zucchini", "squash", "cabbage", "cauliflower", "asparagus", "corn", "bean", "pea", "grape", "orange", "lemon", "lime", "berry", "melon", "peach", "plum", "cherry", "avocado", "kale", "mango", "fruit", "pear", "kiwi", "pineapple"],
    "Dairy & Eggs": ["milk", "egg", "cheese", "butter", "cream", "yogurt", "ghee", "kefir", "whey"],
    "Meat & Poultry": ["beef", "chicken", "pork", "sausage", "ham", "bacon", "turkey", "tenderloin", "lamb", "veal", "duck", "venison", "prosciutto", "salami"],
    "Seafood": ["fish", "salmon", "tuna", "shrimp", "crab", "lobster", "scallop", "clam", "mussel", "oyster", "squid", "octopus", "cod", "halibut", "tilapia", "anchovy", "sardine"],
    "Spices & Herbs": ["salt", "pepper", "parsley", "basil", "oregano", "cinnamon", "cumin", "spice", "herb", "thyme", "rosemary", "sage", "cilantro", "mint", "dill", "chive", "paprika", "nutmeg", "clove", "ginger", "turmeric", "saffron", "cardamom", "coriander"],
    "Condiments & Oils": ["oil", "vinegar", "mustard", "ketchup", "mayo", "sauce", "dressing", "sugar", "syrup", "honey", "jam", "jelly", "spread", "dip", "salsa", "relish", "soy", "teriyaki", "sriracha"]
  };

  const singular = lowerName.endsWith('ies') ? lowerName.slice(0, -3) + 'y' : lowerName.endsWith('es') ? lowerName.slice(0, -2) : lowerName.endsWith('s') ? lowerName.slice(0, -1) : lowerName;

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword) || singular.includes(keyword))) {
      return category;
    }
  }
  return "Other";
};

export const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    setIngredients: (state, action: PayloadAction<Ingredient[]>) => {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearIngredients: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPantry.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.items = [];
      })
      .addCase(fetchPantry.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchPantry.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Could not load pantry.";
        state.items = [];
      })
      .addCase(addIngredient.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(removeIngredient.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { setIngredients, clearIngredients } = ingredientsSlice.actions;

export default ingredientsSlice.reducer;
