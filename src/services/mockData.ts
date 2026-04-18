import type { Recipe, Video, RecipeDetails, IngredientInfo } from '@/types';

const MOCK_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
const MOCK_VIDEO_THUMBNAIL = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 1,
    title: "Mock Pasta with Tomato and Basil",
    image: MOCK_RECIPE_IMAGE,
    imageType: "jpg",
    usedIngredientCount: 2,
    missedIngredientCount: 1,
    likes: 100,
    usedIngredients: [
      { id: 1, name: "tomato", amount: 2, unit: "pcs" } as IngredientInfo,
      { id: 2, name: "basil", amount: 5, unit: "leaves" } as IngredientInfo
    ],
    missedIngredients: [
      { id: 3, name: "pasta", amount: 500, unit: "g" } as IngredientInfo
    ],
    unusedIngredients: []
  },
  {
    id: 2,
    title: "Mock Chicken Salad",
    image: MOCK_RECIPE_IMAGE,
    imageType: "jpg",
    usedIngredientCount: 1,
    missedIngredientCount: 2,
    likes: 50,
    usedIngredients: [
      { id: 4, name: "chicken", amount: 1, unit: "lb" } as IngredientInfo
    ],
    missedIngredients: [
      { id: 5, name: "lettuce", amount: 1, unit: "head" } as IngredientInfo,
      { id: 6, name: "dressing", amount: 2, unit: "tbsp" } as IngredientInfo
    ],
    unusedIngredients: []
  },
  {
      id: 3,
      title: "Mock Vegetable Stir Fry",
      image: MOCK_RECIPE_IMAGE,
      imageType: "jpg",
      usedIngredientCount: 3,
      missedIngredientCount: 0,
      likes: 85,
      usedIngredients: [
          { id: 7, name: "bell pepper", amount: 1, unit: "pc" } as IngredientInfo,
          { id: 8, name: "onion", amount: 1, unit: "pc" } as IngredientInfo,
          { id: 9, name: "broccoli", amount: 1, unit: "head" } as IngredientInfo
      ],
      missedIngredients: [],
      unusedIngredients: []
  }
];

export const MOCK_VIDEOS: Video[] = [
  {
    title: "How to make the perfect pasta",
    shortTitle: "Perfect Pasta",
    youTubeId: "dQw4w9WgXcQ",
    rating: 0.95,
    views: 1000000,
    thumbnail: MOCK_VIDEO_THUMBNAIL,
    length: 345
  },
  {
    title: "Quick and Easy Chicken Salad",
    shortTitle: "Chicken Salad",
    youTubeId: "abcdefghijk",
    rating: 0.88,
    views: 50000,
    thumbnail: MOCK_VIDEO_THUMBNAIL,
    length: 180
  }
];

export const MOCK_RECIPE_DETAILS: RecipeDetails = {
  ...MOCK_RECIPES[0],
  readyInMinutes: 45,
  servings: 4,
  sourceUrl: "http://example.com/recipe",
  summary: "This is a <b>mock recipe</b> description. It serves as a placeholder when the API limit is reached. It describes a delicious pasta dish with fresh ingredients.",
  diets: ["vegetarian", "lacto-vegetarian"],
  dishTypes: ["main course", "dinner"],
  vegetarian: true,
  vegan: false,
  glutenFree: false,
  dairyFree: false,
  cheap: true,
  veryHealthy: true,
  extendedIngredients: [
      { id: 1, name: "tomato", amount: 2, unit: "pcs", original: "2 fresh tomatoes", image: "tomato.png" } as IngredientInfo,
      { id: 2, name: "basil", amount: 5, unit: "leaves", original: "5 fresh basil leaves", image: "basil.png" } as IngredientInfo,
      { id: 3, name: "pasta", amount: 500, unit: "g", original: "500g penne pasta", image: "fusilli.jpg" } as IngredientInfo
  ],
  analyzedInstructions: [
    {
      name: "",
      steps: [
        {
          number: 1,
          step: "Boil water in a large pot.",
          ingredients: [],
          equipment: []
        },
        {
          number: 2,
          step: "Add pasta and cook until al dente.",
          ingredients: [{ id: "3", name: "pasta" }],
          equipment: []
        },
        {
          number: 3,
          step: "Chop tomatoes and basil.",
          ingredients: [{ id: "1", name: "tomato" }, { id: "2", name: "basil" }],
          equipment: []
        },
        {
          number: 4,
          step: "Mix everything together and serve.",
          ingredients: [],
          equipment: []
        }
      ]
    }
  ]
};
