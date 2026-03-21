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
        barStyle="light-content" 
        backgroundColor="#0F232C" 
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F232C' },
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
      </Stack>
    </>
  );
}

