import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Info, Check, Trash2, AlertCircle } from "lucide-react";

export interface CookResult {
  recipeId?: number;
  dryRun: boolean;
  updatedItems: Array<{ itemId: string; name: string; beforeQty: number; afterQty: number }>;
  removedItems: Array<{ itemId: string; name: string; beforeQty: number }>;
  unmatchedIngredients: string[];
  warnings: string[];
}

interface CookResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  result: CookResult | null;
  recipeTitle: string;
  isConfirming: boolean;
}

export function CookResultModal({
  isOpen,
  onClose,
  onConfirm,
  result,
  recipeTitle,
  isConfirming,
}: CookResultModalProps) {
  if (!result) return null;

  const totalAffected = result.updatedItems.length + result.removedItems.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl p-0 overflow-hidden border-0 bg-background">
        <div className="px-6 py-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Cook & Update Pantry
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Review the ingredients that will be deducted for <strong>{recipeTitle}</strong>.
          </DialogDescription>
        </div>

        <ScrollArea className="max-h-[50vh] px-6 py-4">
          <div className="space-y-6">
            {totalAffected === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Info className="h-12 w-12 mb-4 opacity-20 text-primary" />
                <p className="font-semibold text-foreground">Nothing to update</p>
                <p className="text-sm mt-1">No matching ingredients were found in your pantry.</p>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-blue-700">{result.updatedItems.length}</p>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Updated</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-red-700">{result.removedItems.length}</p>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-1">Removed</p>
                </div>
              </div>
            )}

            {result.updatedItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" /> Quantity Reduced
                </h4>
                <ul className="space-y-2">
                  {result.updatedItems.map((item) => (
                    <li key={item.itemId} className="flex justify-between items-center bg-[#f7faf7] border border-[#e8eaec] rounded-xl p-3">
                      <span className="text-sm font-semibold capitalize text-[#10120f]">{item.name}</span>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-white px-2 py-1 rounded-md border shadow-sm">
                        <span>{item.beforeQty}</span>
                        <span>→</span>
                        <span className="text-blue-600 font-bold">{item.afterQty}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.removedItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-600" /> Removed Completely
                </h4>
                <ul className="space-y-2">
                  {result.removedItems.map((item) => (
                    <li key={item.itemId} className="flex justify-between items-center bg-[#f7faf7] border border-[#e8eaec] rounded-xl p-3">
                      <span className="text-sm font-semibold capitalize text-[#10120f]">{item.name}</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase text-[10px] tracking-wider">
                        Used Up
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.unmatchedIngredients.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" /> Not found in pantry
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.unmatchedIngredients.map((name) => (
                    <Badge key={name} variant="secondary" className="bg-muted/50 text-muted-foreground font-medium capitalize">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-full font-semibold">
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={onConfirm} 
              disabled={isConfirming}
              className="flex-1 rounded-full bg-primary hover:bg-primary font-bold text-[#10120f]"
            >
              {isConfirming ? "Cooking..." : "Confirm & Cook"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
