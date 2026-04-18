import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChefHat, Heart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearSelectedRecipe, fetchRecipes, fetchRecipeDetails } from "@/store/slices/recipesSlice";
import { addRecipeToPlan, removeRecipeFromPlan } from "@/store/slices/mealPlannerSlice";
import { toggleFavorite } from "@/store/slices/favoritesSlice";
import type { IngredientInfo, Recipe } from "@/types";
import { RecipeDetailsModal } from "@/components/RecipeDetailsModal";

export function RecipesView() {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const {
    items: recipes,
    status,
    error,
    appliedFilters,
    selectedRecipeDetails,
    detailsStatus,
  } = useAppSelector((state) => state.recipes);
	  const plannedRecipes = useAppSelector((state) => state.mealPlanner.plannedRecipes);
	  const favorites = useAppSelector((state) => state.favorites.items);
	  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	  const [detailsId, setDetailsId] = useState<number | null>(null);

  const now = new Date();
  const expiringSoonNames = useMemo(() => {
    return new Set(
      ingredients
        .filter((ing) => {
          if (!ing.expiryDate) return false;
          const diffDays = (new Date(ing.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 7;
        })
        .map((ing) => ing.name.toLowerCase().trim())
    );
  }, [ingredients]);

  const isExpiringMatch = (ingName: string) => {
    const lower = ingName.toLowerCase();
    for (const expiringName of expiringSoonNames) {
      if (lower.includes(expiringName) || expiringName.includes(lower)) return true;
    }
    return false;
  };

  const ingredientSignature = useMemo(
    () =>
      ingredients
        .map((item) => item.name.trim().toLowerCase())
        .filter(Boolean)
        .join(","),
    [ingredients],
  );

  // If pantry changes while recipes are already loading, queue a refresh so we don't miss the update.
  const lastRequestedSignatureRef = useRef<string>("");
  const queuedSignatureRef = useRef<string>("");

  useEffect(() => {
    if (ingredients.length === 0) return;

    if (status === "loading") {
      queuedSignatureRef.current = ingredientSignature;
      return;
    }

    if (ingredientSignature && ingredientSignature !== lastRequestedSignatureRef.current) {
      lastRequestedSignatureRef.current = ingredientSignature;
      dispatch(fetchRecipes());
    }
  }, [dispatch, ingredientSignature, ingredients.length, status]);

  useEffect(() => {
    if (status === "loading") return;
    const queued = queuedSignatureRef.current;
    if (!queued) return;
    if (queued === lastRequestedSignatureRef.current) {
      queuedSignatureRef.current = "";
      return;
    }
    lastRequestedSignatureRef.current = queued;
    queuedSignatureRef.current = "";
    dispatch(fetchRecipes());
  }, [dispatch, status]);

  const handleSearch = () => {
    if (ingredients.length > 0 && status !== "loading") {
      lastRequestedSignatureRef.current = ingredientSignature;
      dispatch(fetchRecipes());
    }
  };

	  const handleViewRecipe = (id: number) => {
	    setDetailsId(id);
	    dispatch(fetchRecipeDetails(id));
	    setIsDetailsOpen(true);
	  };

	  const handleCloseDetails = () => {
	    setIsDetailsOpen(false);
	    setDetailsId(null);
	    dispatch(clearSelectedRecipe());
	  };

	  const isPlanned = (id: number) => plannedRecipes.some(r => r.id === id.toString());
	  const isFav = (id: number) => favorites.some((r) => r.id === id);
	  const isDetailsLoading =
	    isDetailsOpen &&
	    detailsId !== null &&
	    (detailsStatus === "loading" ||
	      (selectedRecipeDetails?.id !== detailsId && detailsStatus !== "failed"));

  const toggleMealPlan = (recipe: Recipe) => {
    if (isPlanned(recipe.id)) {
      dispatch(removeRecipeFromPlan(recipe.id.toString()));
    } else {
      const required = recipe.missedIngredients.concat(recipe.usedIngredients).map(ing => ({
        name: ing.name,
        quantity: `${ing.amount} ${ing.unit}`
      }));
      dispatch(addRecipeToPlan({
        id: recipe.id.toString(),
        sourceType: 'api',
        title: recipe.title,
        image: recipe.image,
        requiredIngredients: required,
        originalRecipe: recipe
      }));
    }
  };

  return (
    <motion.div
      className="space-y-6 h-[calc(100vh-10rem)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="page-title">Suggested Recipes</h2>
          <p className="text-muted-foreground">
            Based on your pantry ({ingredients.length} items).
          </p>
          {appliedFilters &&
            (appliedFilters.diet ||
              appliedFilters.intolerances.length > 0 ||
              appliedFilters.excludeIngredients.length > 0 ||
              Object.keys(appliedFilters.tuning || {}).length > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {appliedFilters.diet && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-100">
                    Diet: {appliedFilters.diet}
                  </Badge>
                )}
                {appliedFilters.intolerances.map((item) => (
                  <Badge key={item} variant="outline" className="border-border/60">
                    Avoid: {item}
                  </Badge>
                ))}
                {appliedFilters.excludeIngredients.slice(0, 3).map((item) => (
                  <Badge key={item} variant="outline" className="border-border/60">
                    Exclude: {item}
                  </Badge>
                ))}
                {"maxReadyTime" in (appliedFilters.tuning || {}) &&
                  typeof (appliedFilters.tuning as { maxReadyTime?: unknown }).maxReadyTime === "number" && (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                      ≤ {(appliedFilters.tuning as { maxReadyTime: number }).maxReadyTime} min
                    </Badge>
                  )}
                {"sort" in (appliedFilters.tuning || {}) &&
                  typeof (appliedFilters.tuning as { sort?: unknown }).sort === "string" && (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                      Sort: {(appliedFilters.tuning as { sort: string }).sort}
                    </Badge>
                  )}
                {appliedFilters.excludeIngredients.length > 3 && (
                  <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                    +{appliedFilters.excludeIngredients.length - 3} More Excludes
                  </Badge>
                )}
              </div>
            )}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-[260px]">
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={ingredients.length === 0 || status === "loading"}
            className="h-10 w-full border-[#e8eaec] bg-white text-[#10120f] hover:bg-[#dce9dd] hover:text-[#10120f]"
          >
            {status === "loading" ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            onClick={handleSearch}
            disabled={ingredients.length === 0 || status === "loading"}
            className="w-full"
          >
            {status === "loading" ? "Searching..." : "Find"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/25 bg-destructive/5 p-4 text-destructive">
          Error: {error}
        </div>
      )}

      {/* Main Content Area - Full width now */}
      <div className="h-full min-h-0">
        <ScrollArea className="h-full pr-4">
          {status === "loading" && recipes.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden border-[#e8eaec] bg-white animate-pulse"
                >
                  <div className="h-48 bg-muted" />
                  <CardContent className="p-4 space-y-4">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-muted rounded-full" />
                      <div className="h-6 w-20 bg-muted rounded-full" />
                    </div>
                    <div className="h-9 w-full bg-muted rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-border/60 rounded-lg bg-muted/20 h-full">
              <ChefHat className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">No Recipes Found</h3>
              <p className="text-sm">
                Add ingredients to your pantry and we'll find matching recipes!
              </p>
            </div>
          ) : (
	            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20 pt-2">
	              {recipes.map((recipe) => {
	                  const fav = isFav(recipe.id);
                      const isPerfectMatch = recipe.missedIngredientCount === 0;
	                  return (
	                  <Card key={recipe.id} className={`flex flex-col h-full overflow-hidden py-0 transition-all ${isPerfectMatch ? "border-green-400 border-2 shadow-[0_4px_20px_rgba(34,197,94,0.15)] bg-gradient-to-b from-green-50/50 to-white relative" : "border-[#e8eaec] bg-white"}`}>
	                    <div className="relative h-48 w-full overflow-hidden">
                          {isPerfectMatch && (
                            <div className="absolute left-3 top-3 z-20">
                              <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-md font-extrabold px-3 py-1 rounded-full border border-green-600">
                                ✨ 100% Match
                              </Badge>
                            </div>
                          )}
	                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="object-cover w-full h-full"
	                        loading="lazy"
	                      />
	                      <button
	                        type="button"
	                        className={[
	                          "absolute right-3 top-3 z-10 rounded-full p-2 transition-colors",
	                          "bg-white hover:bg-white",
	                          fav ? "text-destructive" : "text-slate-700",
	                        ].join(" ")}
	                        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
	                        title={fav ? "Remove from favorites" : "Add to favorites"}
	                        onClick={(e) => {
	                          e.preventDefault();
	                          e.stopPropagation();
	                          dispatch(
	                            toggleFavorite({
	                              id: recipe.id,
	                              title: recipe.title,
	                              image: recipe.image,
	                              imageType: recipe.imageType,
	                            }),
	                          );
	                        }}
	                      >
	                        <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
	                      </button>
	                      <div className="absolute inset-0 bg-black/45 flex items-end p-4">
	                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm">
	                          {recipe.title}
	                        </h3>
	                      </div>
	                    </div>

                    <CardContent className="flex-1 p-4 space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground tracking-[0.04em] mb-2">
                            Pantry Match
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.usedIngredients.map(
                              (ing: IngredientInfo) => {
                                const expiresSoon = isExpiringMatch(ing.name);
                                return (
                                  <Badge
                                    key={ing.id}
                                    variant="secondary"
                                    className={`${
                                      expiresSoon
                                        ? "bg-orange-100/80 text-orange-800 hover:bg-orange-200 border-0"
                                        : "bg-green-100/50 text-green-800 hover:bg-green-100 border-0"
                                    } max-w-[160px] sm:max-w-[180px] group`}
                                    title={ing.name}
                                  >
                                    <span className="truncate">{ing.name}</span>
                                    {expiresSoon && <span className="ml-1 shrink-0" title="Expiring soon">⏳</span>}
                                  </Badge>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {recipe.missedIngredientCount > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground tracking-[0.04em] mb-2">
                              You Need
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {recipe.missedIngredients.map(
                                (ing: IngredientInfo) => (
                                  <Badge
                                    key={ing.id}
                                    variant="outline"
                                    className="text-muted-foreground border-border/60 max-w-[160px] sm:max-w-[180px]"
                                    title={ing.name}
                                  >
                                    <span className="truncate">{ing.name}</span>
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100">
                            {recipe.missedIngredientCount} Missing
                          </span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                            {recipe.usedIngredientCount} Matching
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto flex gap-2 w-full">
                      <Button
                        variant="default"
                        className="flex-1 bg-primary hover:bg-primary px-2"
                        onClick={() => handleViewRecipe(recipe.id)}
                      >
                        Details
                      </Button>
                      <Button
                        variant={isPlanned(recipe.id) ? "secondary" : "outline"}
                        className={isPlanned(recipe.id) ? "flex-1 border-0 bg-[#10120f] px-2 text-white hover:bg-[#10120f] hover:text-white" : "flex-1 px-2"}
                        onClick={() => toggleMealPlan(recipe as Recipe)}
                        title={isPlanned(recipe.id) ? "Remove from Meal Plan" : "Add to Meal Plan"}
                      >
                        <span className="truncate">{isPlanned(recipe.id) ? "Planned" : "Plan"}</span>
                      </Button>
                    </div>
	                  </Card>
	                );
	              })}
	            </div>
          )}
        </ScrollArea>
      </div>

	      <RecipeDetailsModal
	        recipe={detailsId && selectedRecipeDetails?.id === detailsId ? selectedRecipeDetails : null}
	        isOpen={isDetailsOpen}
	        onClose={handleCloseDetails}
	        isLoading={isDetailsLoading}
	      />
	    </motion.div>
	  );
	}
