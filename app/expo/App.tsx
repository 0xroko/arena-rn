import { NavigationContainer, useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Explore } from "./features/explore";

interface ImageBlock {
  blockId: number;
  initialImageUrl: string;
}

export type Routes = {
  Home: ImageBlock & {
    from: "Explore" | "Home";
    other: {
      next: ImageBlock;
    };
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
  const { colors } = useTheme();
  colors.background = "transparent";

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar translucent style="light" backgroundColor="#00000077" />
        <NavigationContainer

        // theme={{
        //   colors: {
        //     background: "transparent",
        //     border: "transparent",
        //     card: "transparent",
        //     notification: "transparent",
        //     primary: "transparent",
        //     text: "transparent",
        //   },
        //   dark: false,
        // }}
        >
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
                contentStyle: { backgroundColor: "transparent" },
                animation: "none",
                statusBarAnimation: "none",
              }}
              component={Home}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
