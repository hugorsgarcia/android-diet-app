import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, initAuthCache } from "../src/services/supabase";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Login anônimo automático
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        initAuthCache()
          .then(() => setIsReady(true))
          .catch(() => setIsReady(true));
      } else {
        signInAnonymously()
          .then(() => initAuthCache())
          .then(() => setIsReady(true))
          .catch((error) => {
            console.error('Falha no login anônimo — habilite em Supabase Dashboard > Authentication > Sign In Methods > Anonymous:', error);
            setIsReady(true);
          });
      }
    });

    return unsubscribe;
  }, []);

  if (!isReady) return null;

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F8FAFC" 
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen 
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="step/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="create/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="diet/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="diary/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="food-search/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="scanner/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="fasting/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="shopping/index"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

