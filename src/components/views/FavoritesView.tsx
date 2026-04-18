import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeDetailsModal } from "@/components/RecipeDetailsModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleFavorite } from "@/store/slices/favoritesSlice";
import { clearSelectedRecipe, fetchRecipeDetails } from "@/store/slices/recipesSlice";

export function FavoritesView() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites.items);
  const selectedRecipeDetails = useAppSelector((state) => state.recipes.selectedRecipeDetails);
  const detailsStatus = useAppSelector((state) => state.recipes.detailsStatus);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);

  const isLoading =
    isDetailsOpen &&
    detailsId !== null &&
    (detailsStatus === "loading" ||
      (selectedRecipeDetails?.id !== detailsId && detailsStatus !== "failed"));

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="border-[#e8eaec] bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" fill="currentColor" />
                Favourites
              </CardTitle>
              <CardDescription>Your Saved Recipes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {favorites.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
              No favourites yet — tap the heart on any recipe card.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#e8eaec] bg-white divide-y divide-border/60">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="w-full text-left px-3 py-2.5 transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 flex items-center gap-3"
                  onClick={() => {
                    setDetailsId(fav.id);
                    dispatch(fetchRecipeDetails(fav.id));
                    setIsDetailsOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    setDetailsId(fav.id);
                    dispatch(fetchRecipeDetails(fav.id));
                    setIsDetailsOpen(true);
                  }}
                >
                  <img
                    src={fav.image}
                    alt={fav.title}
                    className="h-12 w-12 rounded-lg object-cover border border-border/60 shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm leading-snug line-clamp-1">{fav.title}</div>
                    <div className="text-xs text-muted-foreground">Tap to view details</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-destructive hover:bg-muted"
                    aria-label="Remove from favourites"
                    title="Remove from favourites"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dispatch(toggleFavorite(fav));
                    }}
                  >
                    <Heart className="h-4 w-4" fill="currentColor" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecipeDetailsModal
        recipe={detailsId && selectedRecipeDetails?.id === detailsId ? selectedRecipeDetails : null}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsId(null);
          dispatch(clearSelectedRecipe());
        }}
        isLoading={isLoading}
      />
    </motion.div>
  );
}
