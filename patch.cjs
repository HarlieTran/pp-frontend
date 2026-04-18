const fs = require('fs');
const file = 'src/store/slices/mealPlannerSlice.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/async \(recipe: MealPlanRecipe\) => {/g, 'async (recipe: MealPlanRecipe, { dispatch }) => {');
content = content.replace(/await addRecipeToMealPlanApi\(recipe.id\);/g, 'await addRecipeToMealPlanApi(recipe.id);\n  dispatch(fetchMealPlanner());');

content = content.replace(/async \(recipeId: string\) => {/g, 'async (recipeId: string, { dispatch }) => {');
content = content.replace(/await removeRecipeFromMealPlanApi\(recipeId\);/g, 'await removeRecipeFromMealPlanApi(recipeId);\n  dispatch(fetchMealPlanner());');

content = content.replace(/async \(\) => {\r?\n  await clearMealPlanApi\(\);/g, 'async (_, { dispatch }) => {\n  await clearMealPlanApi();\n  dispatch(fetchMealPlanner());');

fs.writeFileSync(file, content);
