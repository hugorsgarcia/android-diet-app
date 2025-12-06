import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
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
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="step/index"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="create/index"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="diet/index"
          options={{
            headerShown: false
          }}
        />
      </Stack>
    </>
  );
}
