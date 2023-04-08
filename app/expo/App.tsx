import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Explore } from "./features/explore";

export type Routes = {
  Home: undefined;
  Details: { userId: string; otherParam: string };
  Explore: undefined;
};

const defaultScreenOptions = {
  headerShown: false,
};

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "react-query";
import { Home } from "./features/home";

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator<Routes>();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Explore"
              options={defaultScreenOptions}
              component={Explore}
            />
            <Stack.Screen
              name="Home"
              options={defaultScreenOptions}
              component={Home}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
