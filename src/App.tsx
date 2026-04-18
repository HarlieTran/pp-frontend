import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/components/LandingPage';
import { DashboardView } from '@/components/views/DashboardView';
import { PantryView } from '@/components/views/PantryView';
import { ScanView } from '@/components/views/ScanView';
import { RecipesView } from '@/components/views/RecipesView';
import { AiRecipesView } from '@/components/views/AiRecipesView';
import { LoginView } from '@/components/views/LoginView';
import { SignupView } from '@/components/views/SignupView';
import { OnboardingView } from '@/components/views/OnboardingView';
import { ProfileView } from '@/components/views/ProfileView';
import { FavoritesView } from '@/components/views/FavoritesView';
import { MealPlannerView } from '@/components/views/MealPlannerView';
import { useAppDispatch } from '@/store/hooks';
import { fetchPantry, clearIngredients } from '@/store/slices/ingredientsSlice';
import { fetchPreferences, clearPreferences, setPreferences } from '@/store/slices/preferencesSlice';
import { clearFavorites, fetchFavorites } from '@/store/slices/favoritesSlice';
import { fetchMealPlanner, resetMealPlanner } from '@/store/slices/mealPlannerSlice';
import { getAuthToken, logout } from '@/lib/cognito';
import { apiGet } from '@/lib/api';

function App() {
  const dispatch = useAppDispatch();
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'scan' | 'recipes' | 'ai-recipes' | 'profile' | 'meal-planner' | 'favourites'>('dashboard');
  const [isBooting, setIsBooting] = useState(true);

  const shouldShowOnboarding = (profile: any) => {
    return profile?.onboardingCompleted !== true;
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsBooting(false);
          return;
        }

        const data = await apiGet('/me/profile');
        
        // Save the profile info to localStorage for sync/sync logic if needed
        localStorage.setItem('auth_user', JSON.stringify(data));

        const needsOnboarding = shouldShowOnboarding(data);
        setActiveTab(needsOnboarding ? 'profile' : 'dashboard');
        setView(needsOnboarding ? 'onboarding' : 'app');

        // Hydrate Redux with server-backed data
        dispatch(setPreferences(data)); // Push the profile data into preferences slice immediately
        dispatch(fetchPantry());
        dispatch(fetchFavorites());
        dispatch(fetchMealPlanner()); // Note: currently mocked locally
      } catch (err) {
        console.error("Boot error:", err);
        localStorage.removeItem('auth_user');
        logout();
        setView('landing');
      } finally {
        setIsBooting(false);
      }
    })();
  }, [dispatch]);

  const handleAuthSuccess = async () => {
    try {
      const data = await apiGet('/me/profile');
      localStorage.setItem('auth_user', JSON.stringify(data));
      
      const needsOnboarding = shouldShowOnboarding(data);
      setActiveTab(needsOnboarding ? 'profile' : 'dashboard');
      setView(needsOnboarding ? 'onboarding' : 'app');
      
      dispatch(setPreferences(data));
      dispatch(fetchPantry());
      dispatch(fetchFavorites());
      dispatch(fetchMealPlanner());
    } catch (err) {
      console.error("Auth success data load error:", err);
      setView('landing');
    }
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage onLogin={() => setView('login')} onSignUp={() => setView('signup')} />;
  }

  if (view === 'login') {
    return (
      <LoginView
        onBack={() => setView('landing')}
        onGoToSignup={() => setView('signup')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'signup') {
    return (
      <SignupView
        onBack={() => setView('landing')}
        onGoToLogin={() => setView('login')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'onboarding') {
    return <OnboardingView onFinish={handleAuthSuccess} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={() => {
        localStorage.removeItem('auth_user');
        logout();
        dispatch(clearPreferences());
        dispatch(clearIngredients());
        dispatch(clearFavorites());
        dispatch(resetMealPlanner());
        setActiveTab('dashboard');
        setView('landing');
      }}
    >
      {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
      {activeTab === 'pantry' && (
        <PantryView onGoToScan={() => setActiveTab('scan')} />
      )}
      {activeTab === 'scan' && <ScanView />}
      {activeTab === 'recipes' && <RecipesView />}
      {activeTab === 'ai-recipes' && <AiRecipesView />}
      {activeTab === 'meal-planner' && <MealPlannerView />}
      {activeTab === 'favourites' && <FavoritesView />}
      {activeTab === 'profile' && <ProfileView />}
    </Layout>
  );
}

export default App;
