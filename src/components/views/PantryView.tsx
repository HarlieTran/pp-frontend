import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { CATEGORY_LIFESPAN_DAYS, removeIngredient, savePantry } from "@/store/slices/ingredientsSlice";
import { AddPantryItemModal } from "@/components/AddPantryItemModal";
import type { Ingredient } from "@/types";

interface PantryViewProps {
  onGoToScan?: () => void;
}

const CATEGORY_CARDS = [
  { label: "Produce", category: "Produce" },
  { label: "Condiments", category: "Condiments & Oils" },
  { label: "Dairy", category: "Dairy & Eggs" },
  { label: "Meat", category: "Meat & Poultry" },
  { label: "Herbs & Spices", category: "Spices & Herbs" },
  { label: "Seafood", category: "Seafood" },
  { label: "Other", category: "Other" },
] as const;

const ITEM_LIMIT = 6;
const PANTRY_TABLE_GRID = "grid-cols-[124px_minmax(0,1.3fr)_minmax(120px,0.8fr)_minmax(280px,1.2fr)_32px]";



const getDaysUntilExpiry = (expiryDate?: string) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getExpiryLabel = (expiryDate?: string) => {
  const daysLeft = getDaysUntilExpiry(expiryDate);
  if (daysLeft === null) return "No Date";
  if (daysLeft < 0) return "Expired";
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "in 1 day";
  return `in ${daysLeft} days`;
};

const getExpiryProgress = (item: Ingredient) => {
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  if (daysLeft === null) return 6;
  if (daysLeft <= 0) return 100;

  const defaultWindow = CATEGORY_LIFESPAN_DAYS[item.category || "Other"] ?? 30;
  const freshnessRatio = Math.max(0, Math.min(1, daysLeft / defaultWindow));
  return Math.max(8, Math.round((1 - freshnessRatio) * 100));
};

const getProgressColor = (item: Ingredient) => {
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  if (daysLeft === null) return "#e8eaec";
  if (daysLeft <= 2) return "#d9534f";
  if (daysLeft <= 7) return "#00c755";
  return "#dce9dd";
};

const getQuantityLabel = (item: Ingredient) => {
  const parts = [item.quantity, item.unit].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "1 Item";
};



export function PantryView({ onGoToScan }: PantryViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [showingAllItemsFor, setShowingAllItemsFor] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (category: string) => setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  const toggleShowAllItems = (category: string) => setShowingAllItemsFor(prev => ({ ...prev, [category]: !prev[category] }));

  const ingredients = useAppSelector((state) => state.ingredients.items);
  const saveStatus = useAppSelector((state) => state.ingredients.saveStatus);
  const saveError = useAppSelector((state) => state.ingredients.saveError);
  const dispatch = useAppDispatch();

  const ingredientSignature = useMemo(
    () =>
      ingredients
        .map((item) => `${item.id}:${item.name}:${item.quantity ?? ""}:${item.expiryDate ?? ""}`)
        .join("|"),
    [ingredients],
  );

  const lastSavedSignatureRef = useRef<string>("");
  const queuedSignatureRef = useRef<string>("");
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    if (!ingredientSignature) return;
    if (ingredientSignature === lastSavedSignatureRef.current) return;

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      if (saveStatus === "loading") {
        queuedSignatureRef.current = ingredientSignature;
        return;
      }
      lastSavedSignatureRef.current = ingredientSignature;
      dispatch(savePantry());
    }, 450);

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [dispatch, ingredientSignature, saveStatus]);

  useEffect(() => {
    if (saveStatus === "loading") return;
    const queued = queuedSignatureRef.current;
    if (!queued) return;
    if (queued === lastSavedSignatureRef.current) {
      queuedSignatureRef.current = "";
      return;
    }
    lastSavedSignatureRef.current = queued;
    queuedSignatureRef.current = "";
    dispatch(savePantry());
  }, [dispatch, saveStatus]);

  const categorySections = useMemo(
    () =>
      CATEGORY_CARDS.map((section) => {
        const items = ingredients.filter((item) => (item.category || "Other") === section.category);
        return {
          ...section,
          items,
          totalCount: items.length,
        };
      }),
    [ingredients],
  );

  const handleDelete = () => {
    if (!selectedItem) return;
    dispatch(removeIngredient(selectedItem.id));
    setSelectedItem(null);
  };

  const handleOpenAddIngredient = () => {
    setIsActionMenuOpen(false);
    setIsAddModalOpen(true);
  };

  const handleOpenScan = () => {
    setIsActionMenuOpen(false);
    onGoToScan?.();
  };

  return (
    <>
      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <h2 className="page-title text-[#10120f]">Pantry Items</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgba(16,18,15,0.58)]">
            Track what is in every shelf and drawer.
            {saveStatus === "loading" ? "Saving your pantry changes..." : ""}
          </p>
        </div>

        {saveError && (
          <div className="rounded-[22px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5">
          {categorySections.map((section) => {
            const isCollapsed = collapsedCategories[section.category] || false;
            const isShowingAll = showingAllItemsFor[section.category] || false;
            const visibleItems = isShowingAll ? section.items : section.items.slice(0, ITEM_LIMIT);
            const hasMoreItems = section.totalCount > ITEM_LIMIT;

            return (
            <section
              key={section.category}
              className="overflow-hidden rounded-[22px] bg-[#fcfcfc] ring-1 ring-inset ring-[#e8eaec]"
            >
              <button 
                className={`w-full px-8 py-6 sm:px-9 hover:bg-black/[0.02] transition-colors flex items-center justify-between text-left ${!isCollapsed ? 'border-b border-[#e8eaec]' : ''}`}
                onClick={() => toggleCategoryCollapse(section.category)}
              >
                  <div>
                    <h3 className="text-[1.08rem] font-semibold tracking-[-0.04em] text-[#10120f]">{section.label}</h3>
                    <p className="mt-1.5 text-[0.92rem] text-[rgba(16,18,15,0.52)]">
                      {section.totalCount === 0
                        ? "No items added yet."
                        : `${section.totalCount} ${section.totalCount === 1 ? "item" : "items"} in this category`}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-[#e8eaec] text-[rgba(16,18,15,0.48)] shadow-xs transition-colors hover:bg-[#dce9dd] hover:text-[#10120f]">
                    {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </div>
              </button>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {section.totalCount > 0 && (
                      <div className={`bg-black/[0.01] px-8 py-3 sm:px-9 grid ${PANTRY_TABLE_GRID} items-center gap-4 text-[0.78rem] font-medium tracking-[0.04em] text-[rgba(16,18,15,0.48)] border-b border-[#e8eaec]`}>
                        <span className="justify-self-start">Number</span>
                        <span className="justify-self-start">Items</span>
                        <span className="justify-self-start">Quantity</span>
                        <span className="justify-self-start">Expires</span>
                        <span className="justify-self-center"> </span>
                      </div>
                    )}

                    <div className="divide-y divide-[#e8eaec]">
                      {visibleItems.length > 0 ? (
                        visibleItems.map((item, index) => {
                          const progress = getExpiryProgress(item);
                          const progressColor = getProgressColor(item);
                          return (
                            <div
                              key={item.id}
                              className={`grid ${PANTRY_TABLE_GRID} items-center gap-4 px-8 py-4 sm:px-9 hover:bg-black/[0.01] transition-colors`}
                            >
                              <span className="justify-self-start text-[0.9rem] font-medium text-[rgba(16,18,15,0.52)]">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <div className="flex min-w-0 items-center gap-4 pl-2">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00c755] text-[1rem] font-semibold text-white">
                                  {item.name.trim().charAt(0).toUpperCase() || "P"}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-[0.92rem] font-normal text-[#10120f] capitalize">{item.name}</p>
                                  {item.notes ? <p className="truncate text-[0.82rem] text-[rgba(16,18,15,0.48)] mt-0.5">{item.notes}</p> : null}
                                </div>
                              </div>

                              <p className="justify-self-start text-[0.92rem] font-normal text-[rgba(16,18,15,0.82)] capitalize">{getQuantityLabel(item)}</p>

                              <div className="flex min-w-0 items-center gap-3 justify-self-start">
                                <div className="h-[5px] w-full min-w-[140px] max-w-[180px] overflow-hidden rounded-full bg-[#e8eaec]">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%`, backgroundColor: progressColor }}
                                  />
                                </div>
                                <span className="min-w-[84px] text-left text-[0.92rem] font-normal text-[rgba(16,18,15,0.62)]">
                                  {getExpiryLabel(item.expiryDate)}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="grid h-8 w-8 justify-self-center place-items-center rounded-full text-[rgba(16,18,15,0.34)] transition hover:bg-black/[0.05] hover:text-[#10120f]"
                                onClick={() => setSelectedItem(item)}
                                aria-label={`Open actions for ${item.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
      
                    {hasMoreItems ? (
                      <div className="border-t border-[#e8eaec] px-8 py-3 bg-black/[0.01] flex justify-center sm:px-9">
                        <Button 
                          variant="ghost" 
                          className="text-[#00c755] hover:bg-[#00c755]/10 hover:text-[#00c755] font-semibold rounded-full px-6"
                          onClick={() => toggleShowAllItems(section.category)}
                        >
                          {isShowingAll ? "View Less" : `View ${section.totalCount - ITEM_LIMIT} More`}
                        </Button>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
            );
          })}
        </div>
      </motion.div>

      <AddPantryItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <button
        type="button"
        className={`fixed bottom-11 right-7 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#00c755] text-[#10120f] transition hover:bg-[#00c755] hover:text-[#10120f] ${isActionMenuOpen ? "pointer-events-none" : ""}`}
        onClick={() => setIsActionMenuOpen(true)}
        aria-label="Open pantry actions"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="max-w-[360px] rounded-[18px] border-[#e8eaec] bg-white p-0 [&>button]:right-2.5 [&>button]:top-2.5">
          <div className="px-5 pb-5 pt-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-[1.22rem] font-semibold tracking-[-0.04em] text-[#10120f]">
                Pantry Actions
              </DialogTitle>
              <DialogDescription className="text-sm leading-5 text-[rgba(16,18,15,0.58)]">
                Choose how you want to update your pantry.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                className="h-10 w-full bg-[#00c755] px-4 text-[#10120f] hover:bg-[#00c755] hover:text-[#10120f]"
                onClick={handleOpenAddIngredient}
              >
                Add Ingredient
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full border-[#e8eaec] bg-white px-4 text-[#10120f] hover:bg-[#dce9dd]"
                onClick={handleOpenScan}
              >
                Scan Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedItem !== null} onOpenChange={(open) => (!open ? setSelectedItem(null) : null)}>
        <DialogContent className="max-w-[420px] rounded-[18px] border-[#e8eaec] bg-white p-0">
          <div className="px-6 pb-6 pt-8">
            <DialogHeader className="text-left">
              <DialogTitle className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[#10120f]">
                Pantry Item Actions
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-[rgba(16,18,15,0.58)]">
                {selectedItem
                  ? `Choose what you want to do with ${selectedItem.name}.`
                  : "Choose what you want to do with this pantry item."}
              </DialogDescription>
            </DialogHeader>

            {selectedItem ? (
              <div className="mt-5 rounded-[12px] border border-[#e8eaec] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[#10120f]">{selectedItem.name}</p>
                <p className="mt-1 text-sm text-[rgba(16,18,15,0.58)]">
                  {getQuantityLabel(selectedItem)} • {getExpiryLabel(selectedItem.expiryDate)}
                </p>
              </div>
            ) : null}

            <DialogFooter className="mt-6 flex-row justify-between gap-3 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                className="border-[#e8eaec] bg-white text-[#10120f] hover:bg-[#dce9dd]"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#10120f] text-white hover:bg-[#10120f] hover:text-white"
                onClick={handleDelete}
              >
                Delete Item
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
