import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/store/hooks";

interface DashboardViewProps {
  onNavigate: (tab: "recipes" | "pantry" | "meal-planner") => void;
}

type DashboardMode = "pantry" | "ingredients" | "planning";
const CHART_SLOT_COUNT = 7;
const CHART_GRID_TOP = 62;
const CHART_GRID_BOTTOM = 262;
const CHART_AXIS_LABEL_X = 0;
const CHART_PLOT_LEFT = 56;
const CHART_PLOT_RIGHT = 818;
const CHART_GUIDE_LINES = [CHART_GRID_TOP, 129, 196, CHART_GRID_BOTTOM];
const CHART_AXIS_LABEL_Y = [68, 135, 202, 268];
const CHART_LABEL_Y = 318;
const CHART_PRIMARY_GREEN = "#00c755";
const CHART_SECONDARY_GREEN = "rgba(0, 199, 85, 0.34)";

const pantryLabels = ["Expired", "1-7 days", "8-30 days", "31-90 days", "90+ days", "No Date"];
const ingredientLabels = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Poultry",
  "Seafood",
  "Spices & Herbs",
  "Condiments & Oils",
  "Other",
];

const shortenLabel = (value: string, max = 12) => {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
};

const padChartSeries = (values: number[], target = CHART_SLOT_COUNT) => {
  return [...values, ...Array(Math.max(0, target - values.length)).fill(0)].slice(0, target);
};

const padChartLabels = (labels: string[], target = CHART_SLOT_COUNT) => {
  return [...labels, ...Array(Math.max(0, target - labels.length)).fill("")].slice(0, target);
};

const createLinePath = (values: number[], maxValue: number) => {
  const gridTop = CHART_GRID_TOP;
  const gridBottom = CHART_GRID_BOTTOM;
  const stepX = (CHART_PLOT_RIGHT - CHART_PLOT_LEFT) / Math.max(1, values.length - 1);

  return values
    .map((value, index) => {
      const x = CHART_PLOT_LEFT + stepX * index;
      const safeMax = Math.max(1, maxValue);
      const safeValue = Math.max(0, Math.min(safeMax, value));
      const y = gridBottom - (safeValue / safeMax) * (gridBottom - gridTop);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
};

const createAreaPath = (values: number[], maxValue: number) => {
  const gridTop = CHART_GRID_TOP;
  const gridBottom = CHART_GRID_BOTTOM;
  const stepX = (CHART_PLOT_RIGHT - CHART_PLOT_LEFT) / Math.max(1, values.length - 1);

  const points = values.map((value, index) => {
    const x = CHART_PLOT_LEFT + stepX * index;
    const safeMax = Math.max(1, maxValue);
    const safeValue = Math.max(0, Math.min(safeMax, value));
    const y = gridBottom - (safeValue / safeMax) * (gridBottom - gridTop);
    return { x, y };
  });

  if (points.length === 0) return "";

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return `${path} L ${points[points.length - 1].x} ${gridBottom} L ${points[0].x} ${gridBottom} Z`;
};

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [mode, setMode] = useState<DashboardMode>("pantry");

  const ingredients = useAppSelector((state) => state.ingredients.items);
  const plannedRecipes = useAppSelector((state) => state.mealPlanner.plannedRecipes);

  const totalItems = ingredients.length;
  const hasPantryItems = totalItems > 0;
  const recentItems = [...ingredients].slice(-5).reverse();
  const recentIngredientWindow = ingredients.slice(-10);
  const now = new Date();

  const expiringSoon = ingredients.filter((item) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });

  const pantrySeries = pantryLabels.map((label) => {
    return ingredients.filter((item) => {
      if (!item.expiryDate) return label === "No Date";
      const diffDays = (new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (label === "Expired") return diffDays < 0;
      if (label === "1-7 days") return diffDays >= 0 && diffDays <= 7;
      if (label === "8-30 days") return diffDays > 7 && diffDays <= 30;
      if (label === "31-90 days") return diffDays > 30 && diffDays <= 90;
      if (label === "90+ days") return diffDays > 90;
      return false;
    }).length;
  });

  const ingredientSeries = ingredientLabels.map(
    (label) => ingredients.filter((item) => (item.category || "Other") === label).length,
  );
  const recentIngredientSeries = ingredientLabels.map(
    (label) => recentIngredientWindow.filter((item) => (item.category || "Other") === label).length,
  );
  const topIngredientIndex = ingredientSeries.findIndex((count) => count === Math.max(...ingredientSeries, 0));
  const topIngredientCategory = topIngredientIndex >= 0 ? ingredientLabels[topIngredientIndex] : "None";
  const topIngredientCount = topIngredientIndex >= 0 ? ingredientSeries[topIngredientIndex] : 0;

  const planningBreakdown = useMemo(() => {
    return plannedRecipes.slice(0, 6).map((recipe) => {
      const covered = recipe.requiredIngredients.filter((ingredient) =>
        ingredients.some((pantryItem) => {
          const required = ingredient.name.toLowerCase();
          const pantry = pantryItem.name.toLowerCase();
          return required.includes(pantry) || pantry.includes(required);
        }),
      ).length;

      return {
        label: shortenLabel(recipe.title, 11),
        covered,
        missing: Math.max(0, recipe.requiredIngredients.length - covered),
      };
    });
  }, [ingredients, plannedRecipes]);

  const chartData = useMemo(() => {
    if (mode === "ingredients") {
      return {
        labels: padChartLabels(ingredientLabels.map((label) => shortenLabel(label, 12))),
        primary: padChartSeries(ingredientSeries),
        secondary: padChartSeries(recentIngredientSeries),
        hasSecondaryData: true,
        chip: `Top: ${topIngredientCategory}`,
        legendPrimary: "All Pantry",
        legendSecondary: "Recent Adds",
        emptyTitle: "No Ingredient Data Yet",
        emptyBody: "Add ingredients to your pantry and this chart will show which ingredient types are added most often.",
        hasData: hasPantryItems,
      };
    }

    if (mode === "planning") {
      return {
        labels: padChartLabels(planningBreakdown.map((item) => item.label)),
        primary: padChartSeries(planningBreakdown.map((item) => item.covered)),
        secondary: padChartSeries(planningBreakdown.map((item) => item.missing)),
        hasSecondaryData: true,
        chip: `${plannedRecipes.length} Planned`,
        legendPrimary: "Covered",
        legendSecondary: "Missing",
        emptyTitle: "No Planned Meals Yet",
        emptyBody: "Add recipes to your meal plan and the dashboard will show how much of each meal is already covered by your pantry.",
        hasData: planningBreakdown.length > 0,
      };
    }

    return {
      labels: padChartLabels(pantryLabels),
      primary: padChartSeries(pantrySeries),
      secondary: padChartSeries([]),
      hasSecondaryData: false,
      chip: `${expiringSoon.length} Expiring Soon`,
      legendPrimary: "All Pantry",
      legendSecondary: "",
      emptyTitle: "No Pantry Data Yet",
      emptyBody: "Add ingredients to your pantry and this chart will show expiry health.",
      hasData: hasPantryItems,
    };
  }, [
    expiringSoon.length,
    hasPantryItems,
    ingredientSeries,
    recentIngredientSeries,
    topIngredientCategory,
    mode,
    pantrySeries,
    planningBreakdown,
    plannedRecipes.length,
  ]);

  const chartMax = Math.max(4, ...chartData.primary, ...chartData.secondary);
  const axisLabels = [0, Math.ceil(chartMax / 3), Math.ceil((chartMax / 3) * 2), chartMax];
  const stepX = (CHART_PLOT_RIGHT - CHART_PLOT_LEFT) / Math.max(1, chartData.labels.length - 1);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <section className="rounded-[34px] border border-[#e8eaec] bg-white p-4 sm:p-5">
        <div className="rounded-[30px] bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div className="border-b border-[#e8eaec] pb-4">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="flex min-h-[40px] flex-wrap items-center gap-x-10 gap-y-3 text-[1.08rem]">
                <button
                  type="button"
                  className={mode === "pantry" ? "font-semibold tracking-[-0.03em] text-[#10120f]" : "font-medium tracking-[-0.03em] text-[rgba(16,18,15,0.38)] transition hover:text-[#10120f]"}
                  onClick={() => setMode("pantry")}
                >
                  Pantry Health
                </button>
                <button
                  type="button"
                  className={mode === "ingredients" ? "font-semibold tracking-[-0.03em] text-[#10120f]" : "font-medium tracking-[-0.03em] text-[rgba(16,18,15,0.38)] transition hover:text-[#10120f]"}
                  onClick={() => setMode("ingredients")}
                >
                  Ingredients
                </button>
                <button
                  type="button"
                  className={mode === "planning" ? "font-semibold tracking-[-0.03em] text-[#10120f]" : "font-medium tracking-[-0.03em] text-[rgba(16,18,15,0.38)] transition hover:text-[#10120f]"}
                  onClick={() => setMode("planning")}
                >
                  Weekly Planning
                </button>
              </div>

              {chartData.hasData ? (
                <div className="flex min-h-[40px] flex-wrap items-center justify-start gap-5 text-[1.02rem] xl:justify-end">
                  <div className="inline-flex min-w-[150px] items-center justify-center rounded-[18px] bg-[#10120f] px-5 py-2.5 text-base font-semibold leading-none text-white">
                    {chartData.chip}
                  </div>
                    <span className="inline-flex min-w-[120px] items-center gap-3 font-medium leading-none text-[#10120f]">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#00c755]" />
                    {chartData.legendPrimary}
                  </span>
                  {chartData.hasSecondaryData && (
                    <span className="inline-flex min-w-[120px] items-center gap-3 font-medium leading-none text-[rgba(16,18,15,0.62)]">
                      <span className="h-3.5 w-3.5 rounded-full bg-[rgba(0,199,85,0.34)]" />
                      {chartData.legendSecondary}
                    </span>
                  )}
                </div>
              ) : (
                <p className="min-h-[40px] text-base font-medium leading-[40px] text-[rgba(16,18,15,0.48)] xl:text-right">No Dashboard Data Yet</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#e8eaec] bg-white px-4 py-4">
                <p className="text-[0.78rem] font-semibold tracking-[0.04em] text-[rgba(16,18,15,0.52)]">Total Items</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#10120f]">{totalItems}</p>
              </div>
              <div className="rounded-[22px] border border-[#e8eaec] bg-white px-4 py-4">
                <p className="text-[0.78rem] font-semibold tracking-[0.04em] text-[rgba(16,18,15,0.52)]">Top Category</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#10120f]">{topIngredientCount}</p>
                <p className="mt-1 text-sm text-[rgba(16,18,15,0.58)]">{hasPantryItems ? topIngredientCategory : "No Items Yet"}</p>
              </div>
              <div className="rounded-[22px] border border-[#e8eaec] bg-white px-4 py-4">
                <p className="text-[0.78rem] font-semibold tracking-[0.04em] text-[rgba(16,18,15,0.52)]">Recent Adds</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#10120f]">{recentIngredientWindow.length}</p>
                <p className="mt-1 text-sm text-[rgba(16,18,15,0.58)]">{hasPantryItems ? "Latest Pantry Entries" : "No Recent Additions"}</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-[#e8eaec] bg-white">
              <svg viewBox="0 0 860 330" className={`h-[320px] w-full ${chartData.hasData ? "" : "opacity-45"}`}>
                <defs>
                  <linearGradient id="dashboardPrimaryArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PRIMARY_GREEN} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={CHART_PRIMARY_GREEN} stopOpacity="0.03" />
                  </linearGradient>
                  <linearGradient id="dashboardSecondaryArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PRIMARY_GREEN} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={CHART_PRIMARY_GREEN} stopOpacity="0.015" />
                  </linearGradient>
                </defs>

                {CHART_GUIDE_LINES.map((y) => (
                  <line key={y} x1={CHART_PLOT_LEFT} x2={CHART_PLOT_RIGHT} y1={y} y2={y} stroke="#e8eaec" strokeWidth="1.4" />
                ))}

                {[...axisLabels].reverse().map((value, index) => (
                  <text
                    key={value}
                    x={CHART_AXIS_LABEL_X}
                    y={CHART_AXIS_LABEL_Y[index]}
                    fill="rgba(16,18,15,0.44)"
                    fontSize="17"
                    fontWeight="500"
                    textAnchor="start"
                  >
                    {value}
                  </text>
                ))}

                {chartData.hasData && (
                  <>
                    <path
                      d={createAreaPath(chartData.primary, chartMax)}
                      fill="url(#dashboardPrimaryArea)"
                    />
                    {chartData.hasSecondaryData && (
                      <path
                        d={createAreaPath(chartData.secondary, chartMax)}
                        fill="url(#dashboardSecondaryArea)"
                      />
                    )}
                    <path
                      d={createLinePath(chartData.primary, chartMax)}
                      fill="none"
                      stroke={CHART_PRIMARY_GREEN}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {chartData.hasSecondaryData && (
                      <path
                        d={createLinePath(chartData.secondary, chartMax)}
                        fill="none"
                        stroke={CHART_SECONDARY_GREEN}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </>
                )}

                {chartData.labels.map((label, index) => (
                  <text
                    key={`${label}-${index}`}
                    x={CHART_PLOT_LEFT + stepX * index}
                    y={CHART_LABEL_Y}
                    fill="rgba(16,18,15,0.44)"
                    fontSize="14"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                ))}
              </svg>

              {!chartData.hasData && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-[24px] border border-[#e8eaec] bg-white/92 px-7 py-6 text-center">
                    <p className="text-sm font-semibold text-[#10120f]">{chartData.emptyTitle}</p>
                    <p className="mt-2 max-w-[320px] text-sm leading-6 text-[rgba(16,18,15,0.58)]">
                      {chartData.emptyBody}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-[#e8eaec] bg-white px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[1.45rem] font-medium tracking-[-0.04em] text-[#10120f]">Items in Pantry</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(16,18,15,0.58)]">
              The 5 most recently added pantry items appear here automatically from your live pantry list.
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-[#10120f]"
            onClick={() => onNavigate("pantry")}
          >
            View all
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#e8eaec] bg-white">
          <div className="grid grid-cols-[2.2fr_1.2fr_1fr_1.2fr] gap-4 border-b border-[#e8eaec] px-5 py-4 text-sm font-medium text-[rgba(16,18,15,0.48)]">
            <span>Name</span>
            <span>Category</span>
            <span>Quantity</span>
            <span>Expiry</span>
          </div>

          {recentItems.length > 0 ? (
            recentItems.map((item, index) => (
              <div
                key={item.id}
                className={`grid grid-cols-[2.2fr_1.2fr_1fr_1.2fr] gap-4 px-5 py-4 text-sm text-[#10120f] ${
                  index !== recentItems.length - 1 ? "border-b border-[#e8eaec]" : ""
                }`}
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-[rgba(16,18,15,0.62)]">{item.category || "Other"}</span>
                <span>{[item.quantity, item.unit].filter(Boolean).join(" ") || "1 Item"}</span>
                <span className="text-[rgba(16,18,15,0.62)]">{item.expiryDate || "No Date"}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-sm text-[rgba(16,18,15,0.58)]">
              Add pantry items and your five most recent additions will appear here.
            </div>
          )}
        </div>

      </section>
    </motion.div>
  );
}
