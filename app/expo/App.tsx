import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Explore } from "./features/explore";

export type Routes = {
  Home: {
    blockId: string;
    initialImageUrl: string;
  };
  Details: { userId: string; otherParam: string };
  Explore: undefined;
};

const defaultScreenOptions = {
  headerShown: false,
};

import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "react-query";
import { Home } from "./features/home";
import { queryClient } from "./features/shared";

const Stack = createNativeStackNavigator<Routes>();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar translucent style="light" backgroundColor="#00000077" />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Explore">
            <Stack.Screen
              name="Explore"
              options={defaultScreenOptions}
              component={Explore}
            />
            <Stack.Screen
              name="Home"
              options={{
                ...defaultScreenOptions,
                presentation: "transparentModal",
                animation: "none",
                animationDuration: 0,
              }}
              component={Home}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
