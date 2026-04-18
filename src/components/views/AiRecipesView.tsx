import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, CheckCircle2, Clock, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAiRecipes } from "@/store/slices/recipesSlice";
import { addRecipeToPlan, removeRecipeFromPlan } from "@/store/slices/mealPlannerSlice";
import type { AiRecipe } from "@/types";

export function AiRecipesView() {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const { aiRecipes, aiStatus, aiError } = useAppSelector((state) => state.recipes);
  const plannedRecipes = useAppSelector((state) => state.mealPlanner.plannedRecipes);

  const handleGenerate = () => {
    dispatch(fetchAiRecipes());
  };

  const isPlanned = (title: string) => plannedRecipes.some(r => r.id === title);

  const toggleMealPlan = (recipe: AiRecipe) => {
    if (isPlanned(recipe.title)) {
      dispatch(removeRecipeFromPlan(recipe.title));
    } else {
      const required = recipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity
      }));
      dispatch(addRecipeToPlan({
        id: recipe.title,
        sourceType: 'ai',
        title: recipe.title,
        image: recipe.imageUrl,
        requiredIngredients: required,
        originalRecipe: recipe
      }));
    }
  };

  useEffect(() => {
    if (aiStatus === "idle" && aiRecipes.length === 0 && ingredients.length > 0) {
      dispatch(fetchAiRecipes());
    }
  }, [dispatch, aiStatus, aiRecipes.length, ingredients.length]);

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-8rem)] space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">AI Kitchen</h2>
          <p className="text-muted-foreground">
            Custom recipes hand-crafted by our AI chef specifically for your pantry ({ingredients.length} items).
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={ingredients.length === 0 || aiStatus === "loading"}
            className="bg-primary hover:bg-primary rounded-full"
          >
            {aiStatus === "loading" ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {aiError && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-destructive">
          Error: {aiError}
        </div>
      )}

      <div className="h-full min-h-0">
        <ScrollArea className="h-full pr-4 pb-12">
          {aiStatus === "loading" && aiRecipes.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pb-20">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden rounded-3xl border-[#e8eaec] bg-white animate-pulse"
                >
                  <div className="h-56 bg-[#fcfcfc]" />
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 w-3/4 rounded-xl bg-[#f3f4f5]" />
                    <div className="h-4 w-1/2 rounded-xl bg-[#f3f4f5]" />
                    <div className="mt-6 h-24 w-full rounded-xl bg-[#f3f4f5]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : aiStatus !== "loading" && aiRecipes.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-border/60 bg-muted/20 p-12 text-center text-muted-foreground">
              <ChefHat className="mb-4 h-16 w-16 text-[rgba(16,18,15,0.24)]" />
              <h3 className="text-xl font-bold text-[#10120f]">Ready to cook?</h3>
              <p className="text-sm mt-2 mb-6 max-w-sm">
                Add some items to your pantry, then ask the AI Chef to brainstorm unique recipes for you!
              </p>
              <Button onClick={handleGenerate} disabled={ingredients.length === 0} className="rounded-full">
                Generate First Recipes
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pb-20">
              {aiRecipes.map((recipe, index) => {
                const usedCount = recipe.ingredients.filter(i => i.fromPantry).length;
                const totalCount = recipe.ingredients.length;
                
                return (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-[#e8eaec] bg-white py-0 transition-all">
                      <div className="relative h-64 w-full overflow-hidden">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#fcfcfc]">
                            <ChefHat className="h-12 w-12 text-[rgba(16,18,15,0.24)]" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-6 pt-16">
                          <h3 className="text-white font-bold text-2xl leading-tight drop-shadow-md">
                            {recipe.title}
                          </h3>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-white/95 text-primary border-none shadow-md backdrop-blur flex items-center gap-1.5 py-1 px-3">
                            <Sparkles className="h-3.5 w-3.5" /> AI Generated
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="flex-1 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-6 rounded-2xl border border-[#e8eaec] bg-white p-3 text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-600" />
                            {recipe.estimatedTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            {recipe.servings} Servings
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
                                Ingredients
                              </h4>
                              <span className="rounded-full border border-[#e8eaec] bg-white px-2.5 py-1 text-xs font-bold text-[#10120f]">
                                {usedCount}/{totalCount} from Pantry
                              </span>
                            </div>
                            <ul className="space-y-2.5 rounded-2xl border border-[#e8eaec] bg-white p-4">
                              {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm">
                                  {ing.fromPantry ? (
                                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                                  ) : (
                                    <div className="h-4.5 w-4.5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                                  )}
                                  <span className={ing.fromPantry ? "font-semibold text-foreground leading-snug" : "text-muted-foreground leading-snug"}>
                                    <span className="font-bold">{ing.quantity}</span> {ing.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                              Instructions
                            </h4>
                            <ol className="space-y-4 text-sm text-foreground/90 list-none">
                              {recipe.instructions.map((step, i) => (
                                <li key={i} className="flex gap-3 leading-relaxed">
                                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[#e8eaec] bg-white text-xs font-bold text-[#10120f]">
                                    {i + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-4 space-y-4">
                          <div className="rounded-2xl border border-[#e8eaec] bg-white p-4 text-center text-sm font-medium italic text-muted-foreground/80">
                            "{recipe.finalDish}"
                          </div>
                          <Button
                            variant={isPlanned(recipe.title) ? "secondary" : "default"}
                            className={isPlanned(recipe.title) ? "w-full border border-[#e8eaec] bg-white text-[#10120f] hover:bg-[#dce9dd]" : "w-full bg-primary hover:bg-primary"}
                            onClick={() => toggleMealPlan(recipe as AiRecipe)}
                          >
                            {isPlanned(recipe.title) ? "Remove from Meal Plan" : "Add to Meal Plan"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </motion.div>
  );
}
