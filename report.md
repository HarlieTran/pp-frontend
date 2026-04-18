# PantryPal — Codebase Report

**Group #3 | PROG8950 Capstone | Conestoga College (Winter 2026)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| State Management | Redux Toolkit (RTK) |
| UI Components | Radix UI primitives, shadcn/ui, Framer Motion, GSAP |
| Backend (AI/Scan) | Node.js (`claude-proxy.mjs`) — AWS Bedrock (Nova) |
| Backend (Auth/Data) | Node.js (`user-data.mjs`) — file-backed JSON store |
| External APIs | Spoonacular (recipes & videos), Pexels (food photos) |
| Infra / AI | AWS Bedrock (`us.amazon.nova-2-lite-v1`) via AWS SDK v3 |

---

## Architecture Diagram

```mermaid
graph TD
    subgraph Browser["Browser (React + Redux)"]
        Landing[LandingPage]
        Auth[LoginView / SignupView]
        Onboard[OnboardingView]

        subgraph App["Authenticated App (Layout)"]
            Dashboard[DashboardView]
            Pantry[PantryView]
            Scan[ScanView]
            Recipes[RecipesView]
            AiRecipes[AiRecipesView]
            MealPlanner[MealPlannerView]
            Favorites[FavoritesView]
            Profile[ProfileView]
        end

        subgraph Redux["Redux Store"]
            IS[ingredientsSlice]
            RS[recipesSlice]
            PS[preferencesSlice]
            MS[mealPlannerSlice]
            FS[favoritesSlice]
        end

        subgraph Lib["Client Libs"]
            LA[localAuth.ts]
            MPS[mealPlannerStorage.ts]
            FAV[favorites.ts]
        end
    end

    subgraph Vite["Vite Dev Server (proxy)"]
        P1["/api/scan → :8787"]
        P2["/api/recipes/aws → :8787"]
        P3["/api/auth → :8788"]
        P4["/api/pantry → :8788"]
        P5["/api/onboarding → :8788"]
        P6["/api/recipes/spoonacular → :8788"]
        P7["/api/spoonacular → :8788"]
    end

    subgraph Server1["claude-proxy.mjs (:8787)"]
        ScanAPI["POST /api/scan/aws\n(receipt → JSON items)"]
        AiAPI["POST /api/recipes/aws\n(pantry → 3 AI recipes)"]
    end

    subgraph Server2["user-data.mjs (:8788)"]
        AuthAPI["POST /api/auth/signup\nPOST /api/auth/login\nGET  /api/auth/me"]
        OboardAPI["GET/POST /api/onboarding/me"]
        PantryAPI["GET/POST /api/pantry/me"]
        SpoonProxy["POST /api/recipes/spoonacular\nGET  /api/spoonacular/food/videos/search\nGET  /api/spoonacular/recipes/:id/information"]
        AuthDB[(server/data/auth.json)]
    end

    subgraph External["External Services"]
        Bedrock["AWS Bedrock\namazon.nova-2-lite-v1"]
        Spoon["Spoonacular API"]
        Pexels["Pexels API\n(food images)"]
        LS["localStorage\n(local auth mode)"]
    end

    %% Frontend → Vite proxy
    Scan -->|image upload| P1
    AiRecipes -->|pantry ingredients| P2
    Auth -->|login/signup| P3
    Pantry -->|CRUD| P4
    Profile -->|onboarding| P5
    Recipes -->|ingredient search| P6
    Recipes -->|video search / details| P7

    %% Vite proxy → servers
    P1 & P2 --> Server1
    P3 & P4 & P5 & P6 & P7 --> Server2

    %% Servers → external
    ScanAPI & AiAPI --> Bedrock
    AiAPI --> Pexels
    SpoonProxy --> Spoon

    %% Server → DB
    AuthAPI & OboardAPI & PantryAPI --> AuthDB

    %% Redux ↔ views
    IS <-->|addIngredient/removeIngredient/fetchPantry/savePantry| Pantry
    RS <-->|fetchRecipes| Recipes
    RS <-->|fetchAiRecipes| AiRecipes
    PS <-->|fetchPreferences| Profile
    MS <-->|addRecipeToPlan| MealPlanner
    FS <-->|toggleFavorite| Favorites

    %% Lib ↔ Redux
    LA -.->|local mode| IS
    LA -.->|local mode| PS
    MPS -.-> MS
    FAV -.-> FS

    %% Local auth fallback
    LA <-.->|offline fallback| LS
```

---

## Sequence Charts

### 1. User Login & Session Boot

```mermaid
sequenceDiagram
    actor User
    participant App as App.tsx
    participant LS as localStorage
    participant UserSrv as user-data.mjs (:8788)
    participant AuthDB as auth.json

    User->>App: Open app
    App->>LS: getItem(auth_token)
    alt No token
        App-->>User: Show LandingPage
    else Token exists (server mode)
        App->>UserSrv: GET /api/auth/me (Bearer token)
        UserSrv->>AuthDB: Lookup session → user
        AuthDB-->>UserSrv: User record
        UserSrv-->>App: 200 { user }
        App->>LS: setItem(auth_user, ...)
        App->>App: dispatch(fetchPantry, fetchPreferences,\nfetchFavorites, fetchMealPlanner)
        App-->>User: Show Dashboard
    else Token exists (local mode)
        App->>LS: Read pantry + preferences
        App->>App: dispatch(setIngredients, setPreferences,\nfetchFavorites, fetchMealPlanner)
        App-->>User: Show Dashboard
    end
```

### 2. Receipt Scan → Save to Pantry

```mermaid
sequenceDiagram
    actor User
    participant ScanView as ScanView.tsx
    participant Proxy as claude-proxy.mjs (:8787)
    participant Bedrock as AWS Bedrock (Nova)
    participant Redux as ingredientsSlice
    participant UserSrv as user-data.mjs (:8788)

    User->>ScanView: Upload image & click Analyze
    ScanView->>ScanView: FileReader → base64
    ScanView->>Proxy: POST /api/scan/aws\n{ imageBase64, mimeType }
    Proxy->>Bedrock: ConverseCommand\n(text prompt + image bytes)
    Bedrock-->>Proxy: { text: JSON string }
    Proxy-->>ScanView: 200 { text }
    ScanView->>ScanView: Parse items[]\nShow editable review table
    User->>ScanView: Edit names/quantities & Save
    ScanView->>Redux: dispatch(addIngredient) × N
    Redux->>Redux: Auto-categorize + set expiry
    Redux->>UserSrv: POST /api/pantry/me (savePantry)
    UserSrv-->>Redux: 200 { ok, pantry }
```

### 3. Recipe Search (Spoonacular)

```mermaid
sequenceDiagram
    actor User
    participant RecipesView as RecipesView.tsx
    participant RS as recipesSlice
    participant SpoonSvc as spoonacular.ts
    participant UserSrv as user-data.mjs (:8788)
    participant Spoon as Spoonacular API

    User->>RecipesView: Navigate to Recipes tab
    RecipesView->>RS: dispatch(fetchRecipes)
    RS->>RS: Sort pantry items by expiry\nRead diet/allergies from preferencesSlice
    RS->>SpoonSvc: getRecipesByIngredients(ingredients, intolerances, excludes, opts)
    SpoonSvc->>UserSrv: POST /api/recipes/spoonacular\n{ ingredients, intolerances, excludeIngredients, diet, sort }
    loop Fallback strategy (5→3→1→0 ingredients)
        UserSrv->>Spoon: GET /recipes/complexSearch?apiKey=...&includeIngredients=...&...
        Spoon-->>UserSrv: { results[], totalResults }
        alt results > 0
            UserSrv->>UserSrv: Re-rank by full pantry overlap
        end
    end
    UserSrv-->>SpoonSvc: { recipes[], applied }
    SpoonSvc-->>RS: { recipes[], applied, signature }
    RS-->>RecipesView: Update state.recipes.items
    User->>RecipesView: Click recipe card
    RecipesView->>RS: dispatch(fetchRecipeDetails(id))
    RS->>SpoonSvc: getRecipeInformation(id)
    SpoonSvc->>UserSrv: GET /api/spoonacular/recipes/:id/information
    UserSrv->>Spoon: GET /recipes/:id/information?apiKey=...
    Spoon-->>UserSrv: RecipeDetails
    UserSrv-->>SpoonSvc: RecipeDetails
    SpoonSvc-->>RS: RecipeDetails
    RS-->>RecipesView: Show RecipeDetailsSheet
```

### 4. AI Recipe Generation (AWS Bedrock)

```mermaid
sequenceDiagram
    actor User
    participant AiView as AiRecipesView.tsx
    participant RS as recipesSlice
    participant Proxy as claude-proxy.mjs (:8787)
    participant Bedrock as AWS Bedrock (Nova)
    participant Pexels as Pexels API

    User->>AiView: Navigate to AI Recipes tab
    AiView->>RS: dispatch(fetchAiRecipes)
    RS->>RS: Check signature cache\n(skip if pantry unchanged)
    RS->>Proxy: POST /api/recipes/aws\n{ ingredients: [{name, quantity}] }
    Proxy->>Bedrock: ConverseCommand\n(chef prompt + pantry JSON)
    Bedrock-->>Proxy: { text: JSON with 3 recipes }
    Proxy->>Proxy: Parse recipes[]
    loop For each recipe
        Proxy->>Pexels: GET /v1/search?query=imageQuery
        Pexels-->>Proxy: { photos[] }
        Proxy->>Proxy: Attach imageUrl to recipe
    end
    Proxy-->>RS: 200 { text: enriched recipes JSON }
    RS-->>AiView: state.recipes.aiRecipes updated
    User->>AiView: Click Add to Meal Plan
    AiView->>AiView: dispatch(addRecipeToPlan)
```

---

## Project Structure

```
PantryPal/
├── server/
│   ├── claude-proxy.mjs   # AWS Bedrock proxy (scan + AI recipes) — port 8787
│   ├── user-data.mjs      # Auth / pantry / Spoonacular proxy — port 8788
│   └── data/auth.json     # File-backed user/session store
├── src/
│   ├── App.tsx            # Root: session boot, view routing, Redux hydration
│   ├── types.ts           # Shared TypeScript interfaces
│   ├── components/
│   │   ├── views/         # 11 page-level view components
│   │   ├── ui/            # shadcn/ui primitives (button, card, dialog …)
│   │   ├── Layout.tsx     # Sidebar/tab shell
│   │   ├── LandingPage.tsx
│   │   ├── AddPantryItemModal.tsx
│   │   ├── RecipeDetailsModal.tsx
│   │   └── RecipeDetailsSheet.tsx
│   ├── store/
│   │   ├── index.ts       # Redux store config
│   │   ├── hooks.ts       # useAppDispatch / useAppSelector
│   │   └── slices/        # 5 RTK slices (ingredients, recipes, preferences, mealPlanner, favorites)
│   ├── services/
│   │   └── spoonacular.ts # Frontend API client (recipe search, video search, details)
│   └── lib/
│       ├── localAuth.ts   # localStorage-based auth (offline / demo mode)
│       ├── favorites.ts   # localStorage favorites persistence
│       └── mealPlannerStorage.ts  # localStorage meal planner persistence
└── vite.config.ts         # Dev proxy rules + path aliases
```

---

## Key Features & Flows

### 1. Authentication (Dual Mode)
- **Server mode** — credentials posted to `user-data.mjs`; scrypt-hashed passwords stored in `auth.json`; bearer token session.
- **Local mode** — full auth flow runs in `localStorage` (demo / offline). Falls back automatically when the server is unreachable.

### 2. Pantry Management
- Add items via manual form (`AddPantryItemModal`) or receipt scan.
- Auto-categorizes items (Produce, Dairy, Meat, Seafood, Spices, Condiments) and assigns default expiry dates by category.
- Persisted to server (`/api/pantry/me`) or `localStorage` depending on auth mode.

### 3. Receipt / Image Scanning
- User uploads image → base64 encoded → `POST /api/scan/aws`.
- `claude-proxy.mjs` sends multimodal prompt + image bytes to AWS Bedrock.
- Response JSON `{ items: [{name, quantity}] }` is reviewed and saved to pantry.

### 4. Recipe Search (Spoonacular)
- Pantry items sorted by expiry → passed as `includeIngredients`.
- User dietary preferences and allergies from onboarding applied as filters.
- Multi-strategy fallback: tries up to 5 ingredients, then 3, then 1, then no filter.
- Results re-ranked client-side by actual pantry ingredient overlap.

### 5. AI Recipe Generation (AWS Bedrock)
- Pantry items sent to `POST /api/recipes/aws`.
- Bedrock generates exactly 3 recipes with instructions, ingredient breakdown (`fromPantry` flag), and an `imageQuery`.
- Pexels API fetches a food photo per recipe using `imageQuery`.

### 6. Meal Planner & Favorites
- Both persisted to `localStorage` (user-scoped via `auth_user`).
- Meal planner generates a consolidated shopping list from planned recipes.

---

## Data Persistence Summary

| Data | Server Mode | Local Mode |
|---|---|---|
| User account | `auth.json` (scrypt hashed) | `localStorage` (plain password ⚠️) |
| Pantry | `auth.json` (per user) | `localStorage` |
| Onboarding prefs | `auth.json` (per user) | `localStorage` |
| Favorites | `localStorage` | `localStorage` |
| Meal Planner | `localStorage` | `localStorage` |

---

## Notable Issues / Risks

| # | Issue | Severity |
|---|---|---|
| 1 | `.env` contains real AWS & Spoonacular credentials — **rotate immediately** | Critical |
| 2 | Local auth mode stores passwords in plain text in `localStorage` | High |
| 3 | `auth.json` is a flat-file DB with no concurrency protection beyond atomic rename | Medium |
| 4 | No HTTPS enforced in dev; AWS credentials transmitted to a local Node process | Medium |
| 5 | Favorites and meal planner are not user-scoped on the server (localStorage only) | Low |
| 6 | Pexels API key not present in `.env.example`; silently skipped if missing | Low |

---

## Running Locally

```bash
# Install dependencies
npm install

# Terminal 1 — AWS Bedrock proxy (port 8787)
npm run dev:api

# Terminal 2 — Auth/Pantry/Spoonacular proxy (port 8788)
npm run dev:user

# Terminal 3 — Vite frontend (port 5173)
npm run dev
```

Required `.env` variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BEDROCK_MODEL_ID`, `PORT`, `SPOONACULAR_API_KEYS`, `USER_DATA_PORT`.
