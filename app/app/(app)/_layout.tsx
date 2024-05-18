import { useSession } from "context/auth";
import { Redirect, Stack } from "expo-router";
import { Text } from "react-native";
const defaultOptions = {
  headerShown: false,
  // statusBarStyle: "light",
  // statusBarTranslucent: true,
  // statusBarColor: "#00000044",
  animation: "fade",
  animationDuration: 0,
} as const;

// export const unstable_settings = {
//   // Ensure that reloading on `/modal` keeps a back button present.
// };

export default function AppLayout() {
  const { session, isLoading, signOut } = useSession();
  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!session) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
    return <Redirect href="/sign-in" />;
  }

  // This layout can be deferred because it's not the root layout.
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: "#000000",
        },
      }}
      initialRouteName="(tabs)"
    >
      <Stack.Screen name="(tabs)" options={defaultOptions} />
      <Stack.Screen
        name="[...all]"
        options={{
          ...defaultOptions,
        }}
      />
      <Stack.Screen
        name="block/[id]"
        getId={({ params }) => params?.id}
        options={{
          ...defaultOptions,
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "#00000000" },
        }}
      />
      <Stack.Screen
        name="channel/[id]"
        getId={({ params }) => params?.id}
        options={defaultOptions}
      />
      <Stack.Screen
        name="connect"
        getId={({ params }) => params?.id}
        options={{
          ...defaultOptions,
          animation: "none",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "#00000000" },
        }}
      />
      <Stack.Screen name="user/[id]" options={defaultOptions} />
    </Stack>
  );
}
