import Constants from "expo-constants";
import { Image } from "expo-image";
import {
  StyleSheet,
  Text,
  TextProps,
  TouchableNativeFeedbackProps,
  View,
  ViewProps,
} from "react-native";
import { TouchableNativeFeedback } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
// nativewind styled view component

export const AnimatedView = Animated.createAnimatedComponent(View);
export const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ScreenLayoutProps extends ViewProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const Pressable = TouchableNativeFeedback;

export const ScreenLayout = ({
  children,
  style,
  ...props
}: ScreenLayoutProps) => {
  return (
    <View
      style={{
        ...styles.view,
        ...(style as {}),
      }}
    >
      <View style={styles.screen}>{children}</View>
    </View>
  );
};

interface StatusBarPaddingProps {}

// use this in screen layouts to add padding for the status bar (otherwise it would be fixed to the top of the screen)
export const StatusBarPadding = ({}: StatusBarPaddingProps) => {
  return <View style={styles.h} />;
};

ScreenLayout.StatusBarPadding = StatusBarPadding;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 10,
    flex: 1,
  },
  h: {
    height: Constants.statusBarHeight,
    width: "100%",
  },
  view: {
    backgroundColor: "black",
    flex: 1,
  },
});

interface PressableTextProps
  extends Omit<TouchableNativeFeedbackProps, "hitSlop"> {
  children?: React.ReactNode | React.ReactNode[];
  text?: TextProps;
}

export const PressableText = ({
  children,
  text,
  ...props
}: PressableTextProps) => {
  return (
    <Pressable {...props}>
      <Text {...text}>{children}</Text>
    </Pressable>
  );
};
