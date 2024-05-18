import { useQuery } from "@tanstack/react-query";
import { AnimatedView } from "components";
import { SelectableChannel } from "components/SelectableChannel";
import { useSession } from "context/auth";
import { router, useNavigation } from "expo-router";
import { useMe } from "hooks/useMe";
import { tw } from "lib/tw";
import { Fragment, useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  Easing,
  FlipInEasyX,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GetUserChannelsApiResponse } from "types/arena";

const useRecentChannels = () => {
  const { restHeaders } = useSession();
  const { data: me } = useMe();
  return useQuery({
    queryFn: async () => {
      const req = await fetch(
        `https://api.are.na/v2/users/${me?.id}/channels?page=0&per=100`,
        {
          headers: {
            ...restHeaders,
          },
          method: "GET",
        }
      );

      const j = await req.json();
      return j as GetUserChannelsApiResponse;
    },
    queryKey: ["recent_channels"],
    enabled: !!me,
  });
};

interface ConnectPopupProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const ConnectPopup = ({ children }: ConnectPopupProps) => {
  const recentChannels = useRecentChannels();
  const navigation = useNavigation();

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {});
    // animate view exit
    navigation.addListener("beforeRemove", (n) => {
      n.preventDefault();
      opacity.value = withTiming(0, {
        duration: 200,
      });

      setTimeout(() => {
        navigation.dispatch(n.data.action);
      }, 600);
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedView
      style={animatedStyle}
      entering={ZoomIn.easing(Easing.ease).duration(100)}
      exiting={FlipInEasyX.duration(200)}
      className={` bg-black top-[25%] py-6`}
    >
      <Text
        onPress={() => {
          router.replace("/(app)/(tabs)/");
        }}
        className={`text-accent-1 text-lg font-bold text-center py-3`}
      >
        Connect
      </Text>
      <ScrollView>
        {recentChannels.data?.channels?.map((c, i) => {
          return (
            <Fragment key={c.id + "divider2t"}>
              {i === 0 && <View className={tw(`bg-accent-3 h-px`)} />}
              <SelectableChannel channel={c} />
              <View className={tw(`bg-accent-3 h-px`)} />
            </Fragment>
          );
        })}
      </ScrollView>
    </AnimatedView>
  );
};
