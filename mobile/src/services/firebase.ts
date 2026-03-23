import { Platform } from 'react-native';

/**
 * Serviço centralizado do Firebase.
 * 
 * IMPORTANTE: Todas as importações de módulos nativos do Firebase
 * são feitas via require() condicional para evitar crash no Web/Expo Go
 * onde os módulos nativos (RNFBAppModule) não estão disponíveis.
 */

// Lazy-load dos módulos nativos apenas em plataformas nativas
let auth: any = null;
let firestore: any = null;
let functions: any = null;

if (Platform.OS !== 'web') {
  try {
    auth = require('@react-native-firebase/auth').default;
    firestore = require('@react-native-firebase/firestore').default;
    functions = require('@react-native-firebase/functions').default;
  } catch (e) {
    console.warn('Firebase native modules not available:', e);
  }
}

// Autenticação anônima (login silencioso)
export async function signInAnonymously() {
  if (!auth) {
    console.warn('Firebase Auth not available on this platform');
    return null;
  }
  try {
    const userCredential = await auth().signInAnonymously();
    console.log('Usuário autenticado anonimamente:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Erro na autenticação anônima:', error);
    throw error;
  }
}

// Obter o usuário atual (ou null se não logado)
export function getCurrentUser() {
  if (!auth) return null;
  return auth().currentUser;
}

// Ouvir mudanças no estado de autenticação
export function onAuthStateChanged(callback: (user: any) => void) {
  if (!auth) {
    // No web/Expo Go, simula login imediato com null
    callback(null);
    return () => {};
  }
  return auth().onAuthStateChanged(callback);
}

// Chamar a Cloud Function generateDiet
export async function callGenerateDiet(userData: {
  name: string;
  weight: string;
  height: string;
  age: string;
  gender: string;
  objective: string;
  level: string;
}) {
  if (!functions) {
    throw new Error('Firebase Functions not available on this platform');
  }
  const generateDiet = functions().httpsCallable('generateDiet');
  const result = await generateDiet(userData);
  return result.data as { success: boolean; data: any };
}

// Buscar histórico de dietas
export async function callGetDietHistory() {
  if (!functions) {
    throw new Error('Firebase Functions not available on this platform');
  }
  const getDietHistory = functions().httpsCallable('getDietHistory');
  const result = await getDietHistory({});
  return result.data as { diets: any[] };
}

// Buscar dietas direto do Firestore (alternativa offline-first)
export async function getDietsFromFirestore(userId: string) {
  if (!firestore) {
    throw new Error('Firebase Firestore not available on this platform');
  }
  const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('diets')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
}
