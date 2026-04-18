import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { addIngredient, savePantry } from "@/store/slices/ingredientsSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost } from "@/lib/api";

interface ExtractedItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  inFreezer?: boolean;
}

const UNITS = ["pcs", "g", "kg", "oz", "lb", "ml", "L", "cup", "tbsp", "tsp"];

// No longer need AwsResponse and PreparedImagePayload here

export function ScanView() {
  const dispatch = useAppDispatch();
  // UI state for scan lifecycle and user feedback.
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(
    null,
  );
  const [isSaved, setIsSaved] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a temporary browser URL so the user can preview the chosen image.
  // Revoke it on cleanup to avoid memory leaks.
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Build a "clean output preview" from current editable rows.
  // This is what we show in the Raw JSON panel.
  const extractedJson = useMemo(
    () =>
      JSON.stringify(
        {
          items: scannedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity || "1",
            unit: item.unit,
            expiryDate: item.expiryDate || undefined,
            inFreezer: item.inFreezer,
          })),
        },
        null,
        2,
      ),
    [scannedItems],
  );

  // Normalize unknown errors into a readable message for the UI.
  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) {
      return err.message;
    }

    return "Failed to analyze image. Please try again.";
  };

  // Resize large images before upload to improve speed and lower payload size.
  const resizeImageIfNeeded = (file: File, maxDimension = 1500) =>
    new Promise<Blob>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const largestDimension = Math.max(width, height);

        if (!largestDimension || largestDimension <= maxDimension) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        const scale = maxDimension / largestDimension;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to resize selected image."));
          return;
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);

        const outputMimeType = file.type || "image/jpeg";
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error("Unable to resize selected image."));
              return;
            }
            resolve(blob);
          },
          outputMimeType,
          0.9,
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to load selected image."));
      };

      image.src = objectUrl;
    });

  // Send image to backend endpoint via S3 presigned URL
  const extractItemsWithAws = async (file: File): Promise<ExtractedItem[]> => {
    // 1. Get pre-signed URL from our real backend
    const mimeType = file.type || "image/jpeg";
    const filename = file.name || "scan.jpg";
    const { uploadUrl, imageKey } = await apiPost("/me/pantry/upload-url", {
      filename,
      contentType: mimeType,
    });

    // 2. Upload file to S3
    const processedImage = await resizeImageIfNeeded(file, 1500);
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: processedImage,
      headers: {
        "Content-Type": mimeType,
      },
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload image for analysis.");
    }

    // 3. Ask backend to parse the uploaded image
    const { items: parsedItems } = await apiPost("/me/pantry/parse-image", {
      imageKey,
    });

    if (!parsedItems || parsedItems.length === 0) {
      throw new Error("No grocery items were detected in this image.");
    }

    // 4. Map back to UI state
    return parsedItems.map((item: any) => ({
      id: crypto.randomUUID(),
      name: item.name || "",
      quantity: String(item.quantity || "1"),
      unit: item.unit || "pcs",
      expiryDate: "",
      inFreezer: false,
    }));
  };

  // Main scan action:
  // 1) validate input
  // 2) reset old result state
  // 3) run scan request
  // 4) update UI with success or error
  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      setError("Please upload an image first.");
      return;
    }

    setError(null);
    setIsSaved(false);
    setScanSuccessMessage(null);
    setScannedItems([]);
    setIsScanning(true);
    setScanProgress(0);

    const progressTimer = window.setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.max(2, Math.floor((100 - prev) / 8));
      });
    }, 180);

    try {
      const items = await extractItemsWithAws(selectedFile);
      setScannedItems(items);
      setScanProgress(100);
      setScanSuccessMessage(
        `Scan finished. Found ${items.length} item(s). Review and edit below.`,
      );
    } catch (err) {
      setScannedItems([]);
      setScanProgress(0);
      setError(getErrorMessage(err));
    } finally {
      window.clearInterval(progressTimer);
      setIsScanning(false);
    }
  };
  const updateItem = (
    id: string,
    field: "name" | "quantity" | "unit" | "expiryDate" | "inFreezer",
    value: string | boolean,
  ) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (id: string) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addManualItem = () => {
    setScannedItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: "1", unit: "pcs", expiryDate: "", inFreezer: false },
    ]);
  };

  // Full reset for scan workflow and hidden file input.
  const clearScan = () => {
    setSelectedFile(null);
    setScannedItems([]);
    setError(null);
    setScanSuccessMessage(null);
    setIsSaved(false);
    setShowRawJson(false);
    setScanProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Commit edited rows into Redux pantry store.
  // We trim user input and skip empty names.
  const saveToPantry = () => {
    const cleanedItems = scannedItems
      .map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity.trim() || "1",
        unit: item.unit,
        expiryDate: item.expiryDate || undefined,
        inFreezer: item.inFreezer,
      }))
      .filter((item) => item.name.length > 0);

    if (cleanedItems.length === 0) {
      setError("Add at least one valid item before saving.");
      return;
    }

    cleanedItems.forEach((item) => dispatch(addIngredient(item)));
    dispatch(savePantry());
    setIsSaved(true);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="page-title">Scan a Grocery Image</h2>
        <p className="text-muted-foreground">
          Upload a receipt or pantry photo, review extracted items, then save to your pantry.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="rounded-3xl border-[#e8eaec] bg-white lg:col-span-5">
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>
              Upload a receipt, grocery photo, pantry shelf, or spice rack
              image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setError(null);
                  setScanSuccessMessage(null);
                  setIsSaved(false);
                  setScanProgress(0);
                }}
              />

              {!previewUrl ? (
                <div
                  className="flex cursor-pointer flex-col items-center justify-center space-y-4 rounded-2xl border border-[#e8eaec] bg-white p-12 transition-colors hover:bg-[#fcfcfc]"
                  onClick={() => !isScanning && fileInputRef.current?.click()}
                >
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">Click to Upload Image</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full cursor-pointer overflow-hidden rounded-2xl border border-[#e8eaec] bg-white"
                  onClick={() => !isScanning && fileInputRef.current?.click()}
                >
                  <img
                    src={previewUrl}
                    alt="Uploaded grocery"
                    className="block w-full h-auto"
                  />
                </button>
              )}

              {(isScanning || scanProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isScanning ? "Scanning image..." : "Scan complete"}
                    </span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  onClick={handleAnalyzeImage}
                  disabled={isScanning || !selectedFile}
                  className="h-10 w-full bg-[#00c755] text-[#10120f] hover:bg-[#00c755] hover:text-[#10120f] disabled:bg-[#00c755] disabled:text-[#10120f]"
                >
                  {isScanning ? "Scanning..." : "Scan Image"}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearScan}
                  disabled={isScanning}
                  className="h-10 w-full border-[#e8eaec] bg-white text-[#10120f] hover:bg-[#dce9dd] hover:text-[#10120f]"
                >
                  Reset image
                </Button>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#e8eaec] bg-white lg:col-span-7">
          <CardHeader>
            <CardTitle>Extraction Result</CardTitle>
            <CardDescription>
              Edit item name and quantity before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanSuccessMessage && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{scanSuccessMessage}</span>
                </div>
              )}

              {scannedItems.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 py-12 text-center text-muted-foreground">
                  Scan an image to see editable extraction results here.
                </div>
              ) : (
                <>
                  <div className="hidden md:flex gap-3 px-3 text-xs font-semibold text-muted-foreground tracking-[0.04em]">
                    <span className="flex-1">Item Name</span>
                    <span className="w-[70px]">Qty</span>
                    <span className="w-[90px]">Unit</span>
                    <span className="w-[140px]">Expiry</span>
                    <span className="w-[60px] text-center" title="In Freezer">Freezer</span>
                    <span className="w-[40px] text-right">Action</span>
                  </div>
                  <div className="space-y-4 md:space-y-2 mt-4 md:mt-0">
                    {scannedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col items-start gap-3 rounded-xl border border-[#e8eaec] bg-white p-3 md:flex-row md:items-center md:p-2"
                      >
                        <div className="w-full md:flex-1 flex gap-2 items-center">
                          <span className="md:hidden text-xs font-semibold w-16 shrink-0 text-muted-foreground tracking-[0.04em]">Name</span>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              updateItem(item.id, "name", e.target.value)
                            }
                            placeholder="Item name"
                            className="flex-1 rounded-lg bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto items-center">
                          <div className="flex gap-2 items-center md:w-[70px]">
                            <span className="md:hidden text-xs font-semibold w-16 shrink-0 text-muted-foreground tracking-[0.04em]">Qty</span>
                            <Input
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, "quantity", e.target.value)
                              }
                              placeholder="1"
                              type="number"
                              min="0"
                              step="any"
                              className="rounded-lg bg-white"
                            />
                          </div>
                          <div className="flex gap-2 items-center md:w-[90px]">
                            <span className="md:hidden text-xs font-semibold w-12 shrink-0 text-right pr-2 text-muted-foreground tracking-[0.04em]">Unit</span>
                            <Select value={item.unit} onValueChange={(val) => updateItem(item.id, "unit", val)}>
                              <SelectTrigger className="h-10 w-full rounded-lg bg-white">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map((u) => (
                                  <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 md:col-span-1 flex gap-2 items-center md:w-[140px]">
                            <span className="md:hidden text-xs font-semibold w-16 shrink-0 text-muted-foreground tracking-[0.04em]">Expiry</span>
                            <Input
                              value={item.expiryDate}
                              onChange={(e) =>
                                updateItem(item.id, "expiryDate", e.target.value)
                              }
                              type="date"
                              className="flex-1 rounded-lg bg-white"
                              title="Expiry date"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center w-full md:w-auto">
                          <div className="flex items-center gap-2 md:w-[60px] md:justify-center">
                            <span className="md:hidden text-xs font-semibold w-16 shrink-0 text-muted-foreground tracking-[0.04em]">Freezer</span>
                            <input
                              type="checkbox"
                              checked={!!item.inFreezer}
                              onChange={(e) =>
                                updateItem(item.id, "inFreezer", e.target.checked)
                              }
                              className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                              title="Mark as in freezer"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive md:w-[40px]"
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={addManualItem}
                    className="w-full"
                  >
                    Add Row
                  </Button>

                  <Button className="w-full" onClick={saveToPantry}>
                    Add to Your Pantry
                  </Button>

                  {isSaved && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">
                        Pantry updated successfully.
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRawJson((prev) => !prev)}
                      className="w-full"
                    >
                      {showRawJson ? "Hide raw JSON" : "Show raw JSON"}
                    </Button>
                    {showRawJson && (
                      <>
                        <p className="text-sm font-medium">JSON Extraction</p>
                        <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-40">
                          {extractedJson}
                        </pre>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
