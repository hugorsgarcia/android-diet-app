import { supabase } from './supabaseClient';

/**
 * Serviço centralizado do Supabase.
 * 
 * Substitui o antigo firebase.ts, mantendo a mesma API pública
 * para que os screens/stores não precisem de mudanças estruturais.
 */

// ==========================================
// AUTENTICAÇÃO
// ==========================================

// Autenticação anônima (login silencioso)
export async function signInAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    console.log('Usuário autenticado anonimamente:', data.user?.id);
    return data.user;
  } catch (error) {
    console.error('Erro na autenticação anônima:', error);
    throw error;
  }
}

// Obter o usuário atual (ou null se não logado)
export function getCurrentUser() {
  // Supabase armazena o usuário na sessão local
  // Precisamos de um sync check — usamos o cache da sessão
  const session = (supabase.auth as any)._session;
  // Fallback: tenta obter de forma síncrona do AsyncStorage cache
  return session?.user || _cachedUser || null;
}

// Cache interno para manter compatibilidade síncrona com getCurrentUser()
let _cachedUser: any = null;

// Inicializa o cache do usuário (chamar no startup)
export async function initAuthCache() {
  const { data: { session } } = await supabase.auth.getSession();
  _cachedUser = session?.user || null;
}

// Ouvir mudanças no estado de autenticação
export function onAuthStateChanged(callback: (user: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event: any, session: any) => {
      const user = session?.user || null;
      _cachedUser = user;
      // Mantém a mesma interface: callback recebe user (ou null)
      callback(user ? { uid: user.id, ...user } : null);
    }
  );

  // Retorna função de unsubscribe, igual ao Firebase
  return () => subscription.unsubscribe();
}

// ==========================================
// CLOUD FUNCTIONS (via Edge Functions)
// ==========================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Chamar a Edge Function generateDiet
export async function callGenerateDiet(userData: {
  name: string;
  weight: string;
  height: string;
  age: string;
  gender: string;
  objective: string;
  level: string;
  dietType?: string;
}) {
  const { data, error } = await supabase.functions.invoke('generate-diet', {
    body: userData,
  });

  if (error) {
    throw { code: `functions/${error.message.includes('429') ? 'resource-exhausted' : 'internal'}`, message: error.message };
  }

  if (data?.error) {
    const code = data.error.includes('Limite') ? 'functions/resource-exhausted'
      : data.error.includes('autenticado') ? 'functions/unauthenticated'
      : data.error.includes('obrigatório') || data.error.includes('não permitido') ? 'functions/invalid-argument'
      : 'functions/internal';
    throw { code, message: data.error };
  }

  return data as { success: boolean; data: any; dietId?: string };
}

// Buscar histórico de dietas
export async function callGetDietHistory() {
  const { data, error } = await supabase.functions.invoke('get-diet-history', {
    body: {},
  });

  if (error) throw error;
  return data as { diets: any[] };
}

// ==========================================
// DIETS (direto do Supabase)
// ==========================================

// Buscar dietas direto do Supabase (alternativa offline-first)
export async function getDietsFromFirestore(userId: string) {
  const { data, error } = await supabase
    .from('diets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    dietData: row.diet_data,
    name: row.name,
    weight: row.weight,
    height: row.height,
    age: row.age,
    gender: row.gender,
    objective: row.objective,
    level: row.level,
    dietType: row.diet_type,
    createdAt: row.created_at,
  }));
}

// Buscar a última dieta gerada pelo usuário
export async function loadLatestDiet(uid: string) {
  const { data, error } = await supabase
    .from('diets')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    dietData: data.diet_data,
    name: data.name,
    weight: data.weight,
    height: data.height,
    age: data.age,
    gender: data.gender,
    objective: data.objective,
    level: data.level,
    dietType: data.diet_type,
    createdAt: data.created_at,
  };
}

// ==========================================
// WATER TRACKER
// ==========================================
export async function loadWater(uid: string, date: string) {
  const { data, error } = await supabase
    .from('water_tracking')
    .select('*')
    .eq('user_id', uid)
    .eq('date', date)
    .single();

  if (error || !data) return null;
  return { glasses: data.glasses, goal: data.goal, date: data.date };
}

export async function saveWater(uid: string, date: string, data: { glasses: number; goal: number }) {
  await supabase
    .from('water_tracking')
    .upsert(
      { user_id: uid, date, glasses: data.glasses, goal: data.goal },
      { onConflict: 'user_id,date' }
    );
}

// ==========================================
// STREAKS (OFENSIVAS)
// ==========================================
export async function loadStreak(uid: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (error || !data) return null;
  return {
    current: data.current_streak,
    best: data.best_streak,
    lastActiveDate: data.last_active_date,
  };
}

export async function saveStreak(uid: string, data: { current: number; best: number; lastActiveDate: string }) {
  await supabase
    .from('streaks')
    .upsert(
      {
        user_id: uid,
        current_streak: data.current,
        best_streak: data.best,
        last_active_date: data.lastActiveDate,
      },
      { onConflict: 'user_id' }
    );
}

// ==========================================
// WEIGHT HISTORY
// ==========================================
export async function loadWeightHistory(uid: string) {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', uid)
    .order('date', { ascending: true })
    .limit(90);

  if (error) return [];
  return (data || []).map((row: any) => ({
    id: row.id,
    value: row.value,
    date: row.date,
  }));
}

export async function addWeightEntry(uid: string, value: number) {
  await supabase
    .from('weight_entries')
    .insert({ user_id: uid, value, date: new Date().toISOString() });
}

export async function loadWeightGoal(uid: string) {
  const { data, error } = await supabase
    .from('weight_goals')
    .select('goal')
    .eq('user_id', uid)
    .single();

  if (error || !data) return null;
  return data.goal;
}

export async function saveWeightGoal(uid: string, goal: number) {
  await supabase
    .from('weight_goals')
    .upsert({ user_id: uid, goal }, { onConflict: 'user_id' });
}

// ==========================================
// MEAL CHECK-IN
// ==========================================
export async function saveDietMeals(
  uid: string,
  dietId: string,
  meals: Array<{ horario: string; nome: string; alimentos: string[] }>
) {
  // Atualiza o diet_data.refeicoes diretamente na tabela diets
  const { data: existing } = await supabase
    .from('diets')
    .select('diet_data')
    .eq('id', dietId)
    .eq('user_id', uid)
    .single();

  if (existing) {
    const updatedDietData = { ...existing.diet_data, refeicoes: meals };
    await supabase
      .from('diets')
      .update({ diet_data: updatedDietData })
      .eq('id', dietId)
      .eq('user_id', uid);
  }
}

export async function saveMealCheckins(uid: string, dietId: string, checkins: Record<number, boolean>) {
  await supabase
    .from('meal_checkins')
    .upsert(
      { user_id: uid, diet_id: dietId, checkins },
      { onConflict: 'user_id,diet_id' }
    );
}

// ==========================================
// DIARY (DIÁRIO ALIMENTAR)
// ==========================================
export async function loadDiary(uid: string, date: string) {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', uid)
    .eq('date', date)
    .single();

  if (error || !data) return null;
  return { entries: data.entries, dailyGoal: data.daily_goal };
}

export async function saveDiary(uid: string, date: string, entries: any[], dailyGoal: number) {
  await supabase
    .from('diary_entries')
    .upsert(
      { user_id: uid, date, entries, daily_goal: dailyGoal },
      { onConflict: 'user_id,date' }
    );
}

// ==========================================
// FASTING (JEJUM INTERMITENTE)
// ==========================================
export async function loadFasting(uid: string) {
  const { data, error } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (error || !data) return null;
  return {
    isFasting: data.is_fasting,
    currentPlan: data.current_plan,
    startTime: data.start_time,
    endTime: data.end_time,
    history: data.history || [],
  };
}

export async function saveFasting(uid: string, data: any) {
  await supabase
    .from('fasting_sessions')
    .upsert(
      {
        user_id: uid,
        is_fasting: data.isFasting,
        current_plan: data.currentPlan,
        start_time: data.startTime,
        end_time: data.endTime,
        history: data.history || [],
      },
      { onConflict: 'user_id' }
    );
}

// ==========================================
// AI FOOD SWAP (Edge Function call)
// ==========================================
export async function callSwapMealFood(data: {
  mealName: string;
  currentFoods: string[];
  reason: string;
  dietContext: string;
}) {
  const { data: result, error } = await supabase.functions.invoke('swap-meal-food', {
    body: data,
  });

  if (error) throw error;
  if (result?.error) throw new Error(result.error);

  return result as { newAlimentos: string[] };
}
