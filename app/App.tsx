import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { TouchableOpacity, Text } from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import ExtractedPlacesScreen from "./src/screens/ExtractedPlacesScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { useAuthStore } from "./src/store";

const Stack = createStackNavigator();

export default function App() {
  const { loadAuth, displayName } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#2e7d52",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: "Beli Reel Saver",
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={{ marginRight: 16 }}
              >
                <Text style={{ color: "#2e7d52", fontSize: 15 }}>
                  {displayName ?? "Log in"}
                </Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Places"
          component={ExtractedPlacesScreen}
          options={{ title: "Extracted Places" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Connect Beli", presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
