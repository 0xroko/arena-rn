import { Redirect, useLocalSearchParams } from "expo-router";

export default function UserScreen() {
  const p = useLocalSearchParams();

  return <Redirect href={`/(app)/(tabs)/`} />;
}
