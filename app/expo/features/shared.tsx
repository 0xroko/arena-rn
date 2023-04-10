import { Image } from "expo-image";
import { styled } from "nativewind";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  SharedTransition,
  WithTimingConfig,
  withTiming,
} from "react-native-reanimated";
import { QueryClient } from "react-query";

export const Div = styled(View);
export const T = styled(Text);
export const Img = styled(Image);

export const AnimatedDiv = Animated.createAnimatedComponent(Div);

export const AnimatedImage = Animated.createAnimatedComponent(Image);
export const queryClient = new QueryClient();
const delayConfig = {
  duration: 2000,
  easing: Easing.ease,
} as WithTimingConfig;

const originTimingConfig = {
  duration: 2000,
  easing: Easing.ease,
} as WithTimingConfig;

export const transition = SharedTransition.custom((values) => {
  "worklet";
  return {
    originX: withTiming(values.targetOriginX, originTimingConfig),
    originY: withTiming(values.targetOriginY, originTimingConfig),
    height: withTiming(values.targetHeight, delayConfig),
    width: withTiming(values.targetWidth, delayConfig),
  };
});
