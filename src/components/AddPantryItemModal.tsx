import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch } from "@/store/hooks";
import { addIngredient } from "@/store/slices/ingredientsSlice";

interface AddPantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UNITS = ["pcs", "g", "kg", "oz", "lb", "ml", "L", "cup", "tbsp", "tsp"];

export function AddPantryItemModal({ isOpen, onClose }: AddPantryItemModalProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [inFreezer, setInFreezer] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    dispatch(
      addIngredient({
        name,
        quantity,
        unit,
        expiryDate: expiryDate || undefined,
        notes,
        inFreezer,
      })
    );
    // Reset form
    setName("");
    setQuantity("1");
    setUnit("pcs");
    setExpiryDate("");
    setNotes("");
    setInFreezer(false);
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Pantry Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              placeholder="e.g. Roma Tomato"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (optional)</Label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="e.g. opened, store in fridge"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="inFreezer"
              checked={inFreezer}
              onChange={(e) => setInFreezer(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <Label htmlFor="inFreezer" className="font-normal">In Freezer</Label>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end gap-2 flex-row">
          <Button variant="ghost" type="button" onClick={onClose} className="text-primary hover:text-primary/90 font-semibold rounded-full">
            Cancel
          </Button>
          <Button type="button" onClick={handleAdd} className="rounded-full font-semibold">
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
