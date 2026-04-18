import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RecipeDetails } from "@/types";
import {
  Clock,
  Users,
  ExternalLink,
  Info,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addRecipeToPlan, removeRecipeFromPlan } from "@/store/slices/mealPlannerSlice";

interface RecipeDetailsProps {
  recipe: RecipeDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function RecipeDetailsModal({
  recipe,
  isOpen,
  onClose,
  isLoading,
}: RecipeDetailsProps) {
  const dispatch = useAppDispatch();
  const plannedRecipes = useAppSelector((state) => state.mealPlanner.plannedRecipes);

  const isPlanned = recipe ? plannedRecipes.some(r => r.id === recipe.id.toString()) : false;

  const toggleMealPlan = () => {
    if (!recipe) return;
    if (isPlanned) {
      dispatch(removeRecipeFromPlan(recipe.id.toString()));
    } else {
      const required = recipe.extendedIngredients?.map((ing) => ({
        name: ing.name,
        quantity: `${ing.amount} ${ing.unit}`
      })) || [];
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden h-[90vh] md:h-[85vh] flex flex-col gap-0 border-0 rounded-2xl bg-background/95 backdrop-blur-md">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center flex-col gap-6 bg-background">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-r-4 border-r-transparent"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xl font-bold tracking-tight text-foreground/80">
                Crafting your recipe...
              </p>
              <p className="text-sm text-muted-foreground">
                Loading recipe details...
              </p>
            </div>
          </div>
        ) : !recipe ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <Info className="h-16 w-16 mb-6 opacity-20 text-primary" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Recipe details unavailable.
            </h3>
            <p className="max-w-xs mb-8">
              We couldn't retrieve the details for this dish right now.
            </p>
            <Button
              variant="default"
              onClick={onClose}
              className="rounded-full px-8"
            >
              Return to Search
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full relative">
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left column on Desktop */}
              <div className="w-full md:w-[30%] h-64 md:h-auto shrink-0 relative overflow-hidden group">
                <motion.img
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Floating Meta Cards - Desktop only or stack on mobile image */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex-1 min-w-30"
                  >
                    <div className="flex items-center gap-2 text-white/90 mb-1">
                      <Clock className="w-4 h-4 text-primary-foreground" />
                      <span className="text-xs font-semibold">
                        Time
                      </span>
                    </div>
                    <div className="text-white text-lg font-bold">
                      {recipe.readyInMinutes} mins
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex-1 min-w-30"
                  >
                    <div className="flex items-center gap-2 text-white/90 mb-1">
                      <Users className="w-4 h-4 text-primary-foreground" />
                      <span className="text-xs font-semibold">
                        Servings
                      </span>
                    </div>
                    <div className="text-white text-lg font-bold">
                      {recipe.servings} people
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right column on Desktop */}
              <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden">
                <header className="px-6 md:px-10 pt-6 pb-6 space-y-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
                  <DialogDescription className="sr-only">
                    Detailed view of recipe for {recipe.title}
                  </DialogDescription>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-2 pr-12">
                      {recipe.dishTypes?.slice(0, 4).map((type, idx) => (
                        <motion.div
                          key={type}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * idx }}
                        >
                          <Badge
                            variant="outline"
                            className="border-[#e8eaec] bg-[#f7faf7] px-2.5 py-1 text-[10px] font-bold tracking-wider capitalize text-[#10120f]"
                          >
                            {type}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-10 w-10 rounded-full hover:bg-muted shrink-0 transition-colors"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <DialogTitle className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-[1.2]">
                      {recipe.title}
                    </DialogTitle>
                  </motion.div>
                </header>

                <ScrollArea className="flex-1 h-full min-h-0">
                  <div className="px-6 md:px-10 py-8 space-y-12">
                    {/* Summary / About */}
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold text-[#10120f]">
                        About This Dish
                      </h3>
                      <div
                        className="prose prose-sm max-w-none rounded-[24px] border border-[#e8eaec] bg-[#f7faf7] p-5 text-base leading-[1.5] text-muted-foreground [&>a]:text-primary [&>a]:underline [&>b]:font-semibold [&>b]:text-foreground"
                        dangerouslySetInnerHTML={{ __html: recipe.summary }}
                      />
                    </section>

                    <div className="grid lg:grid-cols-1 gap-12">
                      {/* Ingredients */}
                      <section className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                          <h3 className="text-xl font-bold text-[#10120f]">
                            Ingredients
                          </h3>
                          <Badge variant="outline" className="rounded-full">
                            {recipe.extendedIngredients?.length || 0} items
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {recipe.extendedIngredients?.map(
                            (ing: any, idx: number) => (
                              <motion.div
                                key={`${ing.id}-${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: (idx % 10) * 0.05 }}
                                className="group flex items-center gap-4 rounded-2xl border border-[#e8eaec] bg-[#f7faf7] p-4 transition-all"
                              >
                                <div className="h-12 w-12 shrink-0 rounded-xl bg-white p-2 transition-transform">
                                  <img
                                    src={`https://spoonacular.com/cdn/ingredients_100x100/${ing.image}`}
                                    alt={ing.name}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                    loading="lazy"
                                />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-[#10120f] truncate capitalize">
                                    {ing.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {ing.amount} {ing.unit}
                                  </span>
                                </div>
                              </motion.div>
                            ),
                          )}
                        </div>
                      </section>

                      {/* Instructions */}
                      <section className="space-y-8">
                        <div className="flex items-center justify-between border-b pb-4">
                          <h3 className="text-xl font-bold text-[#10120f]">
                            Preparation
                          </h3>
                        </div>

                        {recipe.analyzedInstructions?.[0]?.steps?.length > 0 ? (
                          <ol className="space-y-10 relative">
                            {/* Vertical Line for steps */}
                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-[#10120f]"></div>

                            {recipe.analyzedInstructions[0].steps.map(
                              (step) => (
                              <li
                                  key={step.number}
                                  className="relative pl-16 group"
                                >
                                  <div className="absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#e8eaec] bg-white font-black text-[#10120f] transition-colors group-hover:bg-[#10120f] group-hover:text-white">
                                    {step.number}
                                  </div>
                                  <div className="space-y-4 ml-2">
                                    <p className="max-w-[640px] rounded-[24px] border border-[#e8eaec] bg-[#f7faf7] px-5 py-4 text-lg font-medium leading-[1.5] tracking-tight text-foreground/90">
                                      {step.step}
                                    </p>
                                  </div>
                                </li>
                              ),
                            )}
                          </ol>
                        ) : (
                          <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#e8eaec] bg-[#f7faf7] p-12 text-center">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                              <ExternalLink className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xl font-bold">
                                More details needed?
                              </p>
                              <p className="text-muted-foreground max-w-xs mx-auto">
                                Full cooking directions are available on the
                                creator's website.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              asChild
                              className="rounded-full bg-background px-8"
                            >
                              <a
                                href={recipe.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Original Recipe
                              </a>
                            </Button>
                          </div>
                        )}
                      </section>
                    </div>

                    {/* Footer / Call to Action */}
                    <Separator />
                    <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Recipe Source
                        </p>
                        <p className="font-bold text-foreground">
                          {recipe.sourceName ||
                            new URL(recipe.sourceUrl).hostname}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant={isPlanned ? "secondary" : "default"}
                          size="lg"
                          className={`rounded-full px-8 font-bold ${isPlanned ? "border-0 bg-[#10120f] text-white hover:bg-[#10120f] hover:text-white" : ""}`}
                          onClick={toggleMealPlan}
                        >
                          {isPlanned ? "Planned" : "Add to Plan"}
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="rounded-full px-8 transition-all font-bold"
                        >
                          <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Full Details
                          </a>
                        </Button>
                      </div>
                    </footer>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
