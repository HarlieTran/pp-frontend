
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { RecipeDetails } from '@/types';
import { Clock, Users, ExternalLink } from 'lucide-react';
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog';

interface RecipeDetailsProps {
  recipe: RecipeDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function RecipeDetailsSheet({ recipe, isOpen, onClose, isLoading }: RecipeDetailsProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden flex flex-col p-0">
        
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center flex-col gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
             <p className="text-muted-foreground animate-pulse">Loading recipe details...</p>
          </div>
        ) : !recipe ? (
            <div className="p-8 text-center text-muted-foreground">
                <p>No recipe details available.</p>
                <Button variant="ghost" onClick={onClose} className="mt-4">Close</Button>
            </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Header Image Section */}
            <div className="relative h-64 w-full flex-shrink-0">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/55 flex flex-col justify-end p-6">
                <div className="flex gap-2 mb-2">
                    {recipe.dishTypes?.slice(0, 3).map(type => (
                        <Badge key={type} className="w-fit border border-[#e8eaec] bg-[#f7faf7] capitalize text-[#10120f] hover:bg-[#f7faf7]">
                        {type}
                        </Badge>
                    ))}
                </div>
                <DialogTitle className="text-white text-2xl md:text-3xl font-bold leading-[1.2]">
                  {recipe.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Detailed view of recipe {recipe.title}
                </DialogDescription>
                <div className="flex items-center gap-4 text-white/90 mt-2 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {recipe.readyInMinutes} mins
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {recipe.servings} servings
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto text-xs opacity-80">
                      ID: {recipe.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Scroll Area */}
            <ScrollArea className="flex-1">
              <div className="px-6 py-6 space-y-8">
                
                {/* Summary */}
                <div 
                  className="rounded-[24px] border border-[#e8eaec] bg-[#f7faf7] p-5 text-sm leading-[1.5] text-muted-foreground [&>a]:text-primary [&>a]:underline"
                  dangerouslySetInnerHTML={{ __html: recipe.summary }}
                />

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Ingredients */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#10120f]">
                       Ingredients
                    </h3>
                    <ul className="space-y-3 text-sm">
                      {recipe.extendedIngredients?.map((ing: any, idx: number) => (
                        <li key={`${ing.id}-${idx}`} className="flex items-start gap-3 rounded-2xl border border-[#10120f] bg-[#10120f] p-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex flex-col">
                              <span className="font-medium text-white">{ing.name}</span>
                              <span className="text-xs text-[rgba(255,255,255,0.62)]">{ing.amount} {ing.unit}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Details & Tags */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#10120f]">Details</h3>
                    <div className="flex flex-wrap gap-2">
                       {recipe.vegetarian && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Vegetarian</Badge>}
                       {recipe.vegan && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Vegan</Badge>}
                       {recipe.glutenFree && <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Gluten-Free</Badge>}
                       {recipe.dairyFree && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Dairy-Free</Badge>}
                       {recipe.veryHealthy && <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Very Healthy</Badge>}
                       {recipe.cheap && <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">Cheap</Badge>}
                    </div>

                    <div className="pt-4 space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                        {recipe.sourceUrl ? (
                             <a 
                                href={recipe.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                             >
                                 <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">View Original Recipe</span>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                 </div>
                                 <span className="text-xs text-muted-foreground truncate block mt-1">{recipe.sourceUrl}</span>
                             </a>
                        ) : (
                            <span className="text-sm text-muted-foreground">Source URL not available</span>
                        )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Instructions */}
                <div className="space-y-4 pb-8">
                  <h3 className="text-lg font-semibold text-[#10120f]">Preparation</h3>
                  {recipe.analyzedInstructions?.[0]?.steps?.length > 0 ? (
                    <div className="space-y-6">
                      {recipe.analyzedInstructions[0].steps.map((step) => (
                        <div key={step.number} className="flex gap-4 group">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#e8eaec] bg-white text-sm font-bold text-[#10120f] transition-colors group-hover:bg-[#10120f] group-hover:text-white">
                            {step.number}
                          </div>
                          <p className="max-w-[520px] rounded-[20px] border border-[#e8eaec] bg-[#f7faf7] px-4 py-3 text-sm leading-[1.5] text-foreground/90">
                            {step.step}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-[#e8eaec] bg-[#f7faf7] p-8 text-center">
                        <p className="text-muted-foreground italic">No detailed instructions available within the app.</p>
                        <Button variant="link" asChild className="mt-2">
                            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">Try viewing the original website</a>
                        </Button>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
