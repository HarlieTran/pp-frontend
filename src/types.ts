export interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  expiryDate?: string;
  notes?: string;
  category?: string;
  inFreezer?: boolean;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: IngredientInfo[];
  usedIngredients: IngredientInfo[];
  unusedIngredients: IngredientInfo[];
  likes: number;
}

export interface AppliedRecipeFilters {
  endpoint?: string;
  originalIngredients?: string[];
  includeIngredients?: string[];
  filteredOutIngredients?: string[];
  retriedWithoutIncludeIngredients?: boolean;
  retriedWithReducedIncludeIngredients?: boolean;
  filteredOutRecipesCount?: number;
  totalResults?: number | null;
  number?: number;
  ignorePantry?: boolean;
  ranking?: number;
  addRecipeInformation?: boolean;
  fillIngredients?: boolean;
  diet: string | null;
  intolerances: string[];
  excludeIngredients: string[];
  tuning: {
    sort?: string;
    maxReadyTime?: number;
    [key: string]: unknown;
  };
}

export interface IngredientInfo {
  id: number;
  amount: number;
  unit: string;
  unitLong: string;
  unitShort: string;
  aisle: string;
  name: string;
  original: string;
  originalName: string;
  meta: string[];
  image: string;
}

export interface AiRecipeIngredient {
  name: string;
  quantity: string;
  fromPantry: boolean;
}

export interface AiRecipe {
  title: string;
  servings: string;
  estimatedTime: string;
  ingredients: AiRecipeIngredient[];
  instructions: string[];
  finalDish: string;
  imageUrl?: string;
  imageQuery?: string;
}

export interface Video {
  title: string;
  shortTitle: string;
  youTubeId: string;
  rating: number;
  views: number;
  thumbnail: string;
  length: number;
}

export interface AnalyzedInstruction {
  name: string;
  steps: InstructionStep[];
}

export interface InstructionStep {
  number: number;
  step: string;
  ingredients: Ingredient[];
  equipment: Equipment[];
}

export interface Equipment {
  id: number;
  name: string;
  image: string;
}

export interface RecipeDetails extends Recipe {
  analyzedInstructions: AnalyzedInstruction[];
  summary: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  sourceName?: string;
  diets: string[];
  dishTypes: string[];
  extendedIngredients: IngredientInfo[];
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  veryHealthy: boolean;
  cheap: boolean;
}

export interface MealPlanRecipe {
  id: string;
  sourceType: 'api' | 'ai';
  title: string;
  image?: string;
  requiredIngredients: { name: string; quantity: string }[];
  originalRecipe: Recipe | AiRecipe;
}
