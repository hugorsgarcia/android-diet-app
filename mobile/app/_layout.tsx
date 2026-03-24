import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged } from "../src/services/firebase";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Login anônimo automático
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        setIsReady(true);
      } else {
        signInAnonymously().then(() => setIsReady(true));
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

