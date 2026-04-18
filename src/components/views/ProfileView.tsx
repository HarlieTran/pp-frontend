import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { fetchPreferences } from "@/store/slices/preferencesSlice";
import { getAuthMode, getLocalPreferences, setLocalPreferences } from "@/lib/localAuth";
import { apiGet, apiPatch } from "@/lib/api";
import { getAuthToken } from "@/lib/cognito";

type Diet =
  | "No Restrictions"
  | "Vegetarian"
  | "Vegan"
  | "Pescatarian"
  | "Keto"
  | "Halal"
  | "Gluten-Free";

type Flavor = "Spicy" | "Sweet" | "Savory" | "Tangy" | "Mild";

type OnboardingPayload = {
  dietaryPreference: Diet;
  allergies: string[];
  customAvoid: string[];
  taste: { flavors: Flavor[]; spiceLevel: number };
  goals: string[];
};

const dietOptions: Diet[] = [
  "No Restrictions",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Halal",
  "Gluten-Free",
];

const allergyOptions = ["Nuts", "Dairy", "Eggs", "Shellfish", "Soy", "Gluten"] as const;
const flavorOptions: Flavor[] = ["Spicy", "Sweet", "Savory", "Tangy", "Mild"];
const goalOptions = [
  "Eat Healthier",
  "Lose Weight",
  "Gain Muscle",
  "Save Money",
  "Quick Meals",
  "Explore Cuisines",
] as const;

const uiSpring = { type: "spring", stiffness: 500, damping: 35 } as const;

const CheckboxPill = ({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onToggle}
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.98 }}
    transition={uiSpring}
    className={[
      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      checked
        ? "border-primary/30 bg-primary/10 ring-1 ring-primary/15"
        : "border-border/60 bg-background/50 hover:bg-muted/30 hover:border-primary/25",
    ].join(" ")}
  >
    <span
      className={[
        "h-3.5 w-3.5 rounded border",
        checked ? "border-primary bg-primary" : "border-muted-foreground/40",
      ].join(" ")}
    />
    <span className="font-medium">{label}</span>
  </motion.button>
);

const TogglePill = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ y: -1, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    transition={uiSpring}
    className={[
      "w-full text-left rounded-xl border px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      selected
        ? "border-primary/30 bg-primary/10 text-foreground ring-1 ring-primary/15"
        : "border-border/60 bg-background/50 hover:bg-muted/30 hover:border-primary/25 text-foreground",
    ].join(" ")}
  >
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <span
        className={[
          "h-3.5 w-3.5 rounded-full border grid place-items-center",
          selected ? "border-primary bg-primary shadow-[0_0_0_3px_rgba(0,199,85,0.18)]" : "border-muted-foreground/40",
        ].join(" ")}
      />
    </div>
  </motion.button>
);

const emptyOnboarding = (): OnboardingPayload => ({
  dietaryPreference: "No Restrictions",
  allergies: [],
  customAvoid: [],
  taste: { flavors: [], spiceLevel: 0 },
  goals: [],
});

const questionnaireTitleForStep = (step: number) => {
  if (step === 1) return "Diet";
  if (step === 2) return "Allergies";
  if (step === 3) return "Taste";
  return "Goals";
};

const normalizeOnboarding = (raw: unknown): OnboardingPayload => {
  const base = emptyOnboarding();
  if (!raw || typeof raw !== "object") return base;

  const value = raw as Partial<OnboardingPayload>;
  const dietaryPreference =
    typeof value.dietaryPreference === "string" && (dietOptions as string[]).includes(value.dietaryPreference)
      ? (value.dietaryPreference as Diet)
      : base.dietaryPreference;

  const allergies = Array.isArray(value.allergies) ? value.allergies.filter((x): x is string => typeof x === "string") : [];
  const customAvoid = Array.isArray(value.customAvoid)
    ? value.customAvoid.filter((x): x is string => typeof x === "string")
    : [];

  const tasteRaw = (value.taste ?? {}) as Partial<OnboardingPayload["taste"]>;
  const flavors = Array.isArray(tasteRaw.flavors)
    ? tasteRaw.flavors.filter((x): x is Flavor => typeof x === "string" && (flavorOptions as string[]).includes(x))
    : [];
  const spiceLevelNum = Number(tasteRaw.spiceLevel ?? 0);
  const spiceLevel = Number.isFinite(spiceLevelNum) ? Math.max(0, Math.min(4, Math.round(spiceLevelNum))) : 0;

  const goals = Array.isArray(value.goals) ? value.goals.filter((x): x is string => typeof x === "string") : [];

  return {
    dietaryPreference,
    allergies,
    customAvoid,
    taste: { flavors, spiceLevel },
    goals,
  };
};

export function ProfileView() {
  const dispatch = useAppDispatch();
  const pantryCount = useAppSelector((state) => state.ingredients.items.length);
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string } | null>(null);
  const [saved, setSaved] = useState<OnboardingPayload>(emptyOnboarding());
  const [draft, setDraft] = useState<OnboardingPayload>(emptyOnboarding());
  const [customInput, setCustomInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [questionStep, setQuestionStep] = useState(1);
  const [questionDraft, setQuestionDraft] = useState<OnboardingPayload>(emptyOnboarding());
  const [questionCustomInput, setQuestionCustomInput] = useState("");
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isQuestionSaving, setIsQuestionSaving] = useState(false);

  const initials = useMemo(() => {
    const src = (user?.name || user?.email || "U").trim();
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : src.includes("@") ? src[1] : "";
    return (first + (second || "")).toUpperCase();
  }, [user?.email, user?.name]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMessage(null);

    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setError("You are signed out. Please log in again.");
          return;
        }

        if (getAuthMode() === "local") {
          const storedUserRaw = localStorage.getItem("auth_user");
          const storedUser = storedUserRaw
            ? (JSON.parse(storedUserRaw) as { id?: unknown; name?: unknown; email?: unknown } | null)
            : null;
          const publicUser = storedUser && typeof storedUser === "object"
            ? {
                id: typeof storedUser.id === "string" ? storedUser.id : undefined,
                name: typeof storedUser.name === "string" ? storedUser.name : undefined,
                email: typeof storedUser.email === "string" ? storedUser.email : undefined,
              }
            : null;

          const local = getLocalPreferences();
          const onboarding = normalizeOnboarding(local.onboarding);

          if (cancelled) return;
          setUser(publicUser);
          setSaved(onboarding);
          setDraft(onboarding);
          setQuestionDraft(onboarding);
          setOnboardingCompleted(local.onboardingCompleted === true);
          return;
        }

        const data = await apiGet("/me/profile");

        if (cancelled) return;
        const publicUser = {
          id: data.id,
          name: data.displayName || data.firstName || undefined,
          email: data.email,
        };

        const dietType = Array.isArray(data.preferenceProfile?.dietSignals?.dietType) && data.preferenceProfile.dietSignals.dietType.length > 0 ? data.preferenceProfile.dietSignals.dietType[0] : "No Restrictions";
        const allergies = Array.isArray(data.preferenceProfile?.dietSignals?.allergies) ? data.preferenceProfile.dietSignals.allergies : [];
        const customAvoid = typeof data.preferenceProfile?.dislikes?.csv === "string" && data.preferenceProfile.dislikes.csv ? data.preferenceProfile.dislikes.csv.split(", ").filter(Boolean) : [];
        const flavors = typeof data.preferenceProfile?.likes?.csv === "string" && data.preferenceProfile.likes.csv ? data.preferenceProfile.likes.csv.split(", ").filter(Boolean) : [];
        const goals = typeof data.preferenceProfile?.dietSignals?.notes === "string" && data.preferenceProfile.dietSignals.notes ? data.preferenceProfile.dietSignals.notes.split(", ").filter(Boolean) : [];

        const onboarding: OnboardingPayload = {
          dietaryPreference: dietType as Diet,
          allergies,
          customAvoid,
          taste: { flavors: flavors as Flavor[], spiceLevel: 2 },
          goals,
        };

        setUser(publicUser);
        setSaved(onboarding);
        setDraft(onboarding);
        setQuestionDraft(onboarding);
        setOnboardingCompleted(data.onboardingCompleted === true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load profile.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 3500);
    return () => window.clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (isLoading) return;
    if (isEditing) return;
    if (onboardingCompleted) return;

    const identity = user?.id || user?.email || "unknown";
    const key = `pp_questionnaire_prompted_${identity}`;
    if (localStorage.getItem(key) === "1") return;

    localStorage.setItem(key, "1");
    setQuestionDraft(saved);
    setQuestionStep(1);
    setQuestionCustomInput("");
    setQuestionError(null);
    setIsQuestionnaireOpen(true);
  }, [isEditing, isLoading, onboardingCompleted, saved, user?.email, user?.id]);

  const toggleInList = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const addCustomAvoid = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (draft.customAvoid.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      setCustomInput("");
      return;
    }
    setDraft((d) => ({ ...d, customAvoid: [...d.customAvoid, trimmed] }));
    setCustomInput("");
  };

  const removeCustomAvoid = (name: string) => {
    setDraft((d) => ({ ...d, customAvoid: d.customAvoid.filter((x) => x !== name) }));
  };

  const persistPreferences = async (
    payload: OnboardingPayload,
    successMessage: string,
    onFailure?: (message: string) => void,
  ) => {
    setError(null);
    setMessage(null);

    const token = await getAuthToken();
    if (!token) {
      const msg = "You are signed out. Please log in again.";
      setError(msg);
      onFailure?.(msg);
      return false;
    }

    if (getAuthMode() === "local") {
      setLocalPreferences(payload);
      dispatch(fetchPreferences());
      setSaved(payload);
      setDraft(payload);
      setQuestionDraft(payload);
      setOnboardingCompleted(true);
      setMessage(successMessage);
      return true;
    }

    try {
      await apiPatch("/me/profile", {
        dietType: [payload.dietaryPreference],
        allergies: payload.allergies,
        disliked: payload.customAvoid.join(", "),
        likes: payload.taste.flavors.join(", "),
        notes: payload.goals.join(", ")
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save preferences.";
      setError(msg);
      onFailure?.(msg);
      return false;
    }

    setSaved(payload);
    setDraft(payload);
    setQuestionDraft(payload);
    setOnboardingCompleted(true);
    setMessage(successMessage);

    const stored = localStorage.getItem("auth_user");
    const parsed = stored ? (JSON.parse(stored) as Record<string, unknown> | null) : null;
    const updated = { ...(parsed || {}), onboardingCompleted: true, onboarding: payload };
    localStorage.setItem("auth_user", JSON.stringify(updated));

    // Re-fetch from server so Redux matches what is actually stored in auth.json.
    dispatch(fetchPreferences());

    return true;
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const ok = await persistPreferences(draft, "Preferences updated.");
      if (ok) setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = () => {
    setDraft(saved);
    setCustomInput("");
    setError(null);
    setMessage(null);
    setIsEditing(false);
  };

  const openQuestionnaire = () => {
    setQuestionDraft(saved);
    setQuestionStep(1);
    setQuestionCustomInput("");
    setQuestionError(null);
    setIsQuestionnaireOpen(true);
  };

  const addQuestionCustomAvoid = () => {
    const trimmed = questionCustomInput.trim();
    if (!trimmed) return;
    if (questionDraft.customAvoid.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      setQuestionCustomInput("");
      return;
    }
    setQuestionDraft((d) => ({ ...d, customAvoid: [...d.customAvoid, trimmed] }));
    setQuestionCustomInput("");
  };

  const removeQuestionCustomAvoid = (name: string) => {
    setQuestionDraft((d) => ({ ...d, customAvoid: d.customAvoid.filter((x) => x !== name) }));
  };

  const saveQuestionnaire = async () => {
    setQuestionError(null);
    setIsQuestionSaving(true);
    try {
      const ok = await persistPreferences(questionDraft, "Preferences saved.", setQuestionError);
      if (!ok) return;
      setIsQuestionnaireOpen(false);
      setQuestionStep(1);
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : "Could not save preferences.");
    } finally {
      setIsQuestionSaving(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="page-title">Dashboard</h2>
          <p className="text-muted-foreground">Manage your profile and recipe preferences.</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={openQuestionnaire}
              disabled={isLoading}
            >
              Questionnaire
            </Button>
          ) : null}
          {!isEditing ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setMessage(null);
                setError(null);
                setIsEditing(true);
              }}
              disabled={isLoading}
            >
              Edit Preferences
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={cancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button className="rounded-full" onClick={save} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      {message && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm">{message}</div>}

      {!isLoading && !onboardingCompleted && (
        <div className="rounded-[18px] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">Finish Setup</div>
            <div className="text-muted-foreground">Answer a few questions to personalize recipes and defaults.</div>
          </div>
          <Button className="rounded-full" onClick={openQuestionnaire}>
            Start Questionnaire
          </Button>
        </div>
      )}

      <Dialog
        open={isQuestionnaireOpen}
        onOpenChange={(open) => {
          setIsQuestionnaireOpen(open);
          if (!open) {
            setQuestionStep(1);
            setQuestionCustomInput("");
            setQuestionError(null);
            setIsQuestionSaving(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl border-border/60 bg-background/95 shadow-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-10">
              <span>Preferences Questionnaire</span>
              <Badge variant="secondary" className="rounded-full">
                Step {questionStep} of 4
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {questionnaireTitleForStep(questionStep)} — this helps Pantry Pal tailor suggestions to you.
            </DialogDescription>
          </DialogHeader>

          {questionError && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{questionError}</div>
          )}

          <div className="space-y-5">
            {questionStep === 1 && (
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <div className="font-semibold">Diet</div>
                  <div className="text-sm text-muted-foreground">Choose what best describes your diet.</div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {dietOptions.map((diet) => (
                    <TogglePill
                      key={diet}
                      label={diet}
                      selected={questionDraft.dietaryPreference === diet}
                      onClick={() => setQuestionDraft((d) => ({ ...d, dietaryPreference: diet }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {questionStep === 2 && (
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <div className="font-semibold">Allergies & Avoids</div>
                  <div className="text-sm text-muted-foreground">We’ll avoid these in your recipes.</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allergyOptions.map((allergy) => (
                    <CheckboxPill
                      key={allergy}
                      label={allergy}
                      checked={questionDraft.allergies.includes(allergy)}
                      onToggle={() =>
                        setQuestionDraft((d) => ({ ...d, allergies: toggleInList(d.allergies, allergy) }))
                      }
                    />
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="questionCustomAvoid" className="text-sm">
                    Add custom ingredient to avoid
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="questionCustomAvoid"
                      value={questionCustomInput}
                      placeholder="e.g. cilantro"
                      onChange={(e) => setQuestionCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addQuestionCustomAvoid();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addQuestionCustomAvoid}>
                      Add
                    </Button>
                  </div>

                  {questionDraft.customAvoid.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {questionDraft.customAvoid.map((item) => (
                        <Badge key={item} variant="secondary" className="rounded-full pr-1">
                          <span className="mr-1">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-black/5"
                            onClick={() => removeQuestionCustomAvoid(item)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {questionStep === 3 && (
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <div className="font-semibold">Taste</div>
                  <div className="text-sm text-muted-foreground">Help us match flavors you enjoy.</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {flavorOptions.map((flavor) => (
                    <CheckboxPill
                      key={flavor}
                      label={flavor}
                      checked={questionDraft.taste.flavors.includes(flavor)}
                      onToggle={() =>
                        setQuestionDraft((d) => ({
                          ...d,
                          taste: { ...d.taste, flavors: toggleInList(d.taste.flavors, flavor) as Flavor[] },
                        }))
                      }
                    />
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spice Level</span>
                    <Badge variant="secondary" className="rounded-full">
                      {questionDraft.taste.spiceLevel}/4
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={questionDraft.taste.spiceLevel}
                    onChange={(e) =>
                      setQuestionDraft((d) => ({
                        ...d,
                        taste: { ...d.taste, spiceLevel: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mild</span>
                    <span>Very Spicy</span>
                  </div>
                </div>
              </div>
            )}

            {questionStep === 4 && (
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <div className="font-semibold">Goals</div>
                  <div className="text-sm text-muted-foreground">What are you aiming for?</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => (
                    <CheckboxPill
                      key={goal}
                      label={goal}
                      checked={questionDraft.goals.includes(goal)}
                      onToggle={() => setQuestionDraft((d) => ({ ...d, goals: toggleInList(d.goals, goal) }))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setQuestionStep((s) => Math.max(1, s - 1))}
                disabled={questionStep === 1 || isQuestionSaving}
              >
                Back
              </Button>
            </div>

            <div className="flex gap-2">
              {questionStep < 4 ? (
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => setQuestionStep((s) => Math.min(4, s + 1))}
                  disabled={isQuestionSaving}
                >
                  Next
                </Button>
              ) : (
                <Button type="button" className="rounded-full" onClick={saveQuestionnaire} disabled={isQuestionSaving}>
                  {isQuestionSaving ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 border-border/60 bg-background/75">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
            <CardDescription>Quick details about your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-border/60 grid place-items-center font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{user?.name || "PantryPal user"}</div>
                    <div className="text-sm text-muted-foreground truncate">{user?.email || "—"}</div>
                  </div>
                </div>

                <div className="h-px w-full bg-border/70" />

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pantry items</span>
                    <Badge variant="secondary" className="rounded-full">{pantryCount}</Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/60 bg-background/75">
          <CardHeader className="space-y-1">
            <CardTitle>Preferences</CardTitle>
            <CardDescription>These help tailor recipe suggestions to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Preferences…
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold">Diet</div>
                      <div className="text-sm text-muted-foreground">Choose what best describes your diet.</div>
                    </div>
                    {!isEditing && (
                      <Badge variant="secondary" className="rounded-full">
                        {saved.dietaryPreference}
                      </Badge>
                    )}
                  </div>
                  {isEditing && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {dietOptions.map((diet) => (
                        <TogglePill
                          key={diet}
                          label={diet}
                          selected={draft.dietaryPreference === diet}
                          onClick={() => setDraft((d) => ({ ...d, dietaryPreference: diet }))}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-border/70" />

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold">Allergies & Avoids</div>
                    <div className="text-sm text-muted-foreground">We’ll avoid these in your recipes.</div>
                  </div>

                  {isEditing ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {allergyOptions.map((allergy) => (
                          <CheckboxPill
                            key={allergy}
                            label={allergy}
                            checked={draft.allergies.includes(allergy)}
                            onToggle={() => setDraft((d) => ({ ...d, allergies: toggleInList(d.allergies, allergy) }))}
                          />
                        ))}
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label htmlFor="customAvoid" className="text-sm">
                          Add custom ingredient to avoid
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="customAvoid"
                            value={customInput}
                            placeholder="e.g. cilantro"
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomAvoid();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={addCustomAvoid}>
                            Add
                          </Button>
                        </div>

                        {draft.customAvoid.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {draft.customAvoid.map((item) => (
                              <Badge key={item} variant="secondary" className="rounded-full pr-1">
                                <span className="mr-1">{item}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-black/5"
                                  onClick={() => removeCustomAvoid(item)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {saved.allergies.length === 0 && saved.customAvoid.length === 0 ? (
                        <Badge variant="secondary" className="rounded-full">None</Badge>
                      ) : (
                        <>
                          {saved.allergies.map((item) => (
                            <Badge key={item} variant="outline" className="rounded-full border-border/60">
                              {item}
                            </Badge>
                          ))}
                          {saved.customAvoid.map((item) => (
                            <Badge key={item} variant="outline" className="rounded-full border-border/60">
                              Exclude: {item}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-border/70" />

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold">Taste</div>
                    <div className="text-sm text-muted-foreground">Help us match flavors you enjoy.</div>
                  </div>

                  {isEditing ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {flavorOptions.map((flavor) => (
                          <CheckboxPill
                            key={flavor}
                            label={flavor}
                            checked={draft.taste.flavors.includes(flavor)}
                            onToggle={() =>
                              setDraft((d) => ({
                                ...d,
                                taste: { ...d.taste, flavors: toggleInList(d.taste.flavors, flavor) as Flavor[] },
                              }))
                            }
                          />
                        ))}
                      </div>

                      <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Spice Level</span>
                          <Badge variant="secondary" className="rounded-full">
                            {draft.taste.spiceLevel}/4
                          </Badge>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={draft.taste.spiceLevel}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              taste: { ...d.taste, spiceLevel: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Mild</span>
                          <span>Very Spicy</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {saved.taste.flavors.length === 0 ? (
                        <Badge variant="secondary" className="rounded-full">No Flavors Selected</Badge>
                      ) : (
                        saved.taste.flavors.map((item) => (
                          <Badge key={item} variant="secondary" className="rounded-full">
                            {item}
                          </Badge>
                        ))
                      )}
                      <Badge variant="outline" className="rounded-full border-border/60">
                        Spice: {saved.taste.spiceLevel}/4
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-border/70" />

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold">Goals</div>
                    <div className="text-sm text-muted-foreground">What are you aiming for?</div>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {goalOptions.map((goal) => (
                        <CheckboxPill
                          key={goal}
                          label={goal}
                          checked={draft.goals.includes(goal)}
                          onToggle={() => setDraft((d) => ({ ...d, goals: toggleInList(d.goals, goal) }))}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {saved.goals.length === 0 ? (
                        <Badge variant="secondary" className="rounded-full">No Goals Selected</Badge>
                      ) : (
                        saved.goals.map((item) => (
                          <Badge key={item} variant="secondary" className="rounded-full">
                            {item}
                          </Badge>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
