import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

/**
 * Serviço centralizado do Firebase.
 * 
 * IMPORTANTE: Para funcionar, o arquivo google-services.json (Android)
 * deve estar na raiz do diretório mobile/ e configurado no app.json.
 */

// Autenticação anônima (login silencioso)
export async function signInAnonymously() {
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
  return auth().currentUser;
}

// Ouvir mudanças no estado de autenticação
export function onAuthStateChanged(callback: (user: any) => void) {
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
  const generateDiet = functions().httpsCallable('generateDiet');
  const result = await generateDiet(userData);
  return result.data as { success: boolean; data: any };
}

// Buscar histórico de dietas
export async function callGetDietHistory() {
  const getDietHistory = functions().httpsCallable('getDietHistory');
  const result = await getDietHistory({});
  return result.data as { diets: any[] };
}

// Buscar dietas direto do Firestore (alternativa offline-first)
export async function getDietsFromFirestore(userId: string) {
  const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('diets')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
