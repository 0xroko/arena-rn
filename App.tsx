import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Home } from "./features/home";
import { NavigationContainer } from "@react-navigation/native";

export type Routes = {
  Home: undefined;
  Details: { userId: string; otherParam: string };
};

const defaultScreenOptions = {
  headerShown: false,
};

import { QueryClient, QueryClientProvider, useQuery } from "react-query";

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator<Routes>();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            options={defaultScreenOptions}
            component={Home}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
