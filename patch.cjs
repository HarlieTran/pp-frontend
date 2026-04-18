const fs = require('fs');
let code = fs.readFileSync('src/store/slices/mealPlannerSlice.ts', 'utf8');

const target = `export const addRecipeToPlan = createAsyncThunk("mealPlanner/add", async (recipe: MealPlanRecipe, { dispatch }) => {
  await addRecipeToMealPlanApi(recipe.id);
  dispatch(fetchMealPlanner());
  return recipe;
});`;

const replacement = `export const addRecipeToPlan = createAsyncThunk("mealPlanner/add", async (recipe: MealPlanRecipe, { dispatch }) => {
  if (recipe.sourceType === 'ai' && typeof recipe.id === 'string' && isNaN(parseInt(recipe.id))) {
    await addAiRecipeToMealPlanApi(recipe.originalRecipe);
  } else {
    await addRecipeToMealPlanApi(recipe.id);
  }
  dispatch(fetchMealPlanner());
  return recipe;
});`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/store/slices/mealPlannerSlice.ts', code);
  console.log("Success exact match");
} else {
  // try regex
  const regex = /export const addRecipeToPlan = createAsyncThunk\("mealPlanner\/add", async \(recipe: MealPlanRecipe, \{ dispatch \}\) => \{[\s\S]*?return recipe;\r?\n\}\);/;
  if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/store/slices/mealPlannerSlice.ts', code);
    console.log("Success regex match");
  } else {
    console.log("Failed to match");
  }
}
