import { Redirect, router, useLocalSearchParams } from "expo-router";

export default function RouterScreen() {
  // get params and if 2 navigate to channel and if one navigate to user
  // blocks will be handled automatically since their href is /block/:id
  const { all, id } = useLocalSearchParams<{
    all: string[];
    id: string;
  }>();

  if (all?.length === 2) {
    return <Redirect href={`/(app)/channel/${id}`} />;
  } else if (all?.length === 1) {
    router.replace(`/(app)/user/${id}`);
    return;
  } else {
    router.replace(`/(app)/(tabs)/`);
    return;
  }
}
