import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Div } from "./explore";

interface HomeProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const Home = ({ children }: HomeProps) => {
  const isPressed = useSharedValue(false);
  const offset = useSharedValue({ x: 0, y: 0 });

  const position = useSharedValue(0);
  const posY = useSharedValue(0);

  const flingGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart((e) => {})
    .onEnd((e) => {
      position.value = withSequence(
        withTiming(position.value + 10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    });

  const filngUp = Gesture.Fling()
    .direction(Directions.UP)
    .onStart((e) => {})
    .onEnd((e) => {
      posY.value = withSequence(
        withTiming(posY.value - 10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }, { translateY: posY.value }],
  }));

  const gesturesCobined = Gesture.Simultaneous(filngUp, flingGesture);

  return (
    <Div className={`flex-1`}>
      <Div className="flex flex-1 flex-col items-center justify-center">
        <GestureDetector gesture={gesturesCobined}>
          <Animated.View
            style={[
              {
                width: 200,
                height: 200,
                backgroundColor: "#f30429",
              },
              animatedStyle,
            ]}
          />
        </GestureDetector>
      </Div>
    </Div>
  );
};
