
import { format, addDays } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addRecipeToPlan } from "@/store/slices/mealPlannerSlice";
import type { MealPlanRecipe } from "@/types";
import { X } from "lucide-react";

export function MealPlannerCalendar() {
  const dispatch = useAppDispatch();
  const plannedRecipes = useAppSelector((state) => state.mealPlanner.plannedRecipes);

  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));

  const handleRemoveDate = (recipe: MealPlanRecipe) => {
    // Re-adding the recipe with an empty date should clear it.
    dispatch(addRecipeToPlan({ ...recipe, date: "" }));
  };

  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-4">Your Week</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {days.map((day) => {
          const dateString = day.toISOString().split('T')[0];
          const recipesForDay = plannedRecipes.filter(r => r.date && r.date === dateString);

          return (
            <div key={dateString} className="bg-white rounded-2xl border border-[#e8eaec] overflow-hidden flex flex-col h-full shadow-sm">
                <div className="bg-[#f6f7f8] px-4 py-2 border-b border-[#e8eaec]">
                  <p className="text-sm font-bold text-[#10120f]">{format(day, "EEEE")}</p>
                  <p className="text-xs font-medium text-muted-foreground">{format(day, "MMM d")}</p>
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2 min-h-[120px]">
                  {recipesForDay.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center mt-6">No meals planned</p>
                  ) : (
                    recipesForDay.map(recipe => (
                      <div key={recipe.id} className="relative bg-white border border-[#e8eaec] rounded-[10px] p-2.5 shadow-xs group hover:border-[#00c755] transition-colors">
                        <p className="text-xs font-semibold text-[#10120f] line-clamp-2 pr-5 leading-snug">{recipe.title}</p>
                        <button 
                          onClick={() => handleRemoveDate(recipe)}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-[rgba(16,18,15,0.38)] hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                          title="Remove from day"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}
