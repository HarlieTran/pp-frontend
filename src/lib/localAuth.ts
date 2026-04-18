import type { Ingredient } from "@/types";

type Onboarding = {
  dietaryPreference: string;
  allergies: string[];
  customAvoid: string[];
  taste: { flavors: string[]; spiceLevel: number };
  goals: string[];
};

type PublicUser = {
  id: string;
  name: string;
  email: string;
  onboardingCompleted?: boolean;
  onboarding?: Onboarding | null;
};

type LoosePublicUser = {
  id: string;
  name: string;
  email: string;
  onboardingCompleted?: boolean;
  onboarding?: unknown;
};

type LocalUserRecord = PublicUser & {
  password: string;
  pantry: Ingredient[];
};

const LOCAL_USERS_KEY = "pantrypal_local_users";
const AUTH_MODE_KEY = "auth_mode";

const safeReadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeOnboarding = (value: unknown): Onboarding | null => {
  return value && typeof value === "object" ? (value as Onboarding) : null;
};

const readLocalUsers = () => safeReadJson<LocalUserRecord[]>(LOCAL_USERS_KEY, []);

const writeLocalUsers = (users: LocalUserRecord[]) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const toPublicUser = (user: LocalUserRecord): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  onboardingCompleted: user.onboardingCompleted ?? false,
  onboarding: user.onboarding ?? null,
});

export const setAuthMode = (mode: "server" | "local") => {
  localStorage.setItem(AUTH_MODE_KEY, mode);
};

export const getAuthMode = (): "server" | "local" | null => {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  return mode === "server" || mode === "local" ? mode : null;
};

export const clearAuthMode = () => {
  localStorage.removeItem(AUTH_MODE_KEY);
};

export const cacheLocalAuthUser = (user: LoosePublicUser, password: string) => {
  const users = readLocalUsers();
  const email = normalizeEmail(user.email);
  const nextRecord: LocalUserRecord = {
    ...user,
    email,
    password,
    pantry: users.find((entry) => entry.email === email)?.pantry ?? [],
    onboardingCompleted: user.onboardingCompleted ?? false,
    onboarding: normalizeOnboarding(user.onboarding),
  };

  writeLocalUsers([...users.filter((entry) => entry.email !== email), nextRecord]);
};

export const signupLocalUser = (payload: { name: string; email: string; password: string }) => {
  const users = readLocalUsers();
  const email = normalizeEmail(payload.email);
  if (users.some((user) => user.email === email)) {
    throw new Error("Email already exists.");
  }

  const user: LocalUserRecord = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    email,
    password: payload.password,
    pantry: [],
    onboardingCompleted: false,
    onboarding: null,
  };

  writeLocalUsers([...users, user]);
  return user;
};

export const loginLocalUser = (payload: { email: string; password: string }) => {
  const email = normalizeEmail(payload.email);
  const users = readLocalUsers();
  const user = users.find((entry) => entry.email === email);
  if (!user || user.password !== payload.password) {
    throw new Error("Invalid email or password.");
  }

  return user;
};

export const createLocalSession = (user: PublicUser) => {
  const token = `local-${user.id}`;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
  setAuthMode("local");
  return token;
};

export const getStoredPublicUser = (): PublicUser | null => {
  return safeReadJson<PublicUser | null>("auth_user", null);
};

export const getCurrentLocalUserRecord = () => {
  const user = getStoredPublicUser();
  if (!user?.email) return null;
  const email = normalizeEmail(user.email);
  return readLocalUsers().find((entry) => entry.email === email) ?? null;
};

export const upsertCurrentLocalUser = (updater: (user: LocalUserRecord) => LocalUserRecord) => {
  const current = getCurrentLocalUserRecord();
  if (!current) return null;

  const updated = updater(current);
  const users = readLocalUsers();
  writeLocalUsers([...users.filter((entry) => entry.email !== current.email), updated]);
  localStorage.setItem("auth_user", JSON.stringify(toPublicUser(updated)));
  return updated;
};

export const getLocalPantry = (): Ingredient[] => {
  return getCurrentLocalUserRecord()?.pantry ?? [];
};

export const setLocalPantry = (pantry: Ingredient[]) => {
  upsertCurrentLocalUser((user) => ({ ...user, pantry }));
  return pantry;
};

export const getLocalPreferences = () => {
  const user = getCurrentLocalUserRecord();
  return {
    onboardingCompleted: user?.onboardingCompleted === true,
    onboarding: user?.onboarding ?? null,
  };
};

export const setLocalPreferences = (onboarding: Onboarding) => {
  upsertCurrentLocalUser((user) => ({
    ...user,
    onboarding,
    onboardingCompleted: true,
  }));
};

export const reviveLocalSessionFromStoredUser = () => {
  const user = getStoredPublicUser();
  if (!user) return null;
  createLocalSession(user);
  return user;
};
