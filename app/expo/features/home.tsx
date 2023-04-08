import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  WithSpringConfig,
  withTiming,
  WithTimingConfig,
} from "react-native-reanimated";
import { Button, Image } from "react-native";
import { Matrix3, multiply3, identity3, useSpring } from "react-native-redash";
import { Div, T } from "./explore";
import { FC, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Routes } from "../App";

interface HomeProps {
  children?: React.ReactNode | React.ReactNode[];
}

function translateMatrix(matrix: Matrix3, x: number, y: number) {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
}

function scaleMatrix(matrox: Matrix3, value: number) {
  "worklet";
  return multiply3(matrox, [value, 0, 0, 0, value, 0, 0, 0, 1]);
}

export const Home: FC<NativeStackScreenProps<Routes, "Explore">> = ({
  navigation,
  route,
}) => {
  const isPressed = useSharedValue(false);
  const offset = useSharedValue({ x: 0, y: 0 });

  const position = useSharedValue(0);

  const flingGesture = Gesture.Fling()
    .direction(Directions.UP)
    .onStart((e) => {})
    .onEnd((e) => {
      console.log("fling");
      position.value = withSequence(
        withTiming(position.value + 10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    });

  const filngStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: position.value }],
    };
  });

  const ref = useAnimatedRef();

  const elmRef = useAnimatedRef();
  const origin = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);
  const translation = useSharedValue({ x: 0, y: 0 });

  const isPinching = useSharedValue(false);
  const transform = useSharedValue(identity3);

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      console.log("pinch");
      const measured = measure(ref);
      isPinching.value = true;

      origin.value = {
        x: event.focalX - measured.width / 2,
        y: event.focalY - measured.height / 2,
      };
    })
    .onBegin((event) => {})
    .onChange((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      let matrix = identity3;
      scale.value = 1;
      matrix = translateMatrix(matrix, origin.value.x, origin.value.y);
      matrix = scaleMatrix(matrix, scale.value);
      matrix = translateMatrix(matrix, -origin.value.x, -origin.value.y);
      transform.value = multiply3(matrix, transform.value);
      isPinching.value = false;
    });

  const opacity = useSharedValue(1);
  const isLongPressing = useSharedValue(false);

  const [showModal, setShowModal] = useState(false);

  const [higlighted, setHighlighted] = useState(-1);

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((event) => {
      if (!isPinching.value) return;
      translation.value = {
        x: event.translationX,
        y: event.translationY,
      };
    })
    .onEnd(() => {
      let matrix = identity3;
      translation.value = { x: 0, y: 0 };
      matrix = translateMatrix(
        matrix,
        translation.value.x,
        translation.value.y
      );
      transform.value = multiply3(matrix, transform.value);
    });

  const sharedIndex = useSharedValue(-1);

  const longPressGesture = Gesture.Pan()
    .onStart((e) => {
      isLongPressing.value = true;
      runOnJS(setShowModal)(true);
      sharedIndex.value = -1;
      opacity.value = 0.5;
    })
    .onEnd((e) => {
      isLongPressing.value = false;
      console.log("long press");
      runOnJS(setShowModal)(false);
      opacity.value = 1;
    })
    .onFinalize((e) => {
      console.log("long press finalize");
    })
    .onUpdate((e) => {
      if (e.translationY < 0) {
        sharedIndex.value = 0;
        return;
      }

      let h = 45;
      if (elmRef.current !== null) {
        h = measure(elmRef)?.height ?? 60;
      }
      sharedIndex.value = Math.floor(e.translationY / h);
    })
    .activateAfterLongPress(400)
    .maxPointers(1);

  useDerivedValue(() => {
    runOnJS(setHighlighted)(sharedIndex.value);
  }, [sharedIndex.value]);

  const animatedStyle = useAnimatedStyle(() => {
    let matrix = identity3;
    if (translation.value.x !== 0 || translation.value.y !== 0) {
      matrix = translateMatrix(
        matrix,
        translation.value.x,
        translation.value.y
      );
    }

    if (scale.value !== 1) {
      matrix = translateMatrix(matrix, origin.value.x, origin.value.y);
      matrix = scaleMatrix(matrix, scale.value);
      matrix = translateMatrix(matrix, -origin.value.x, -origin.value.y);
    }

    // if (isPinching.value && false)
    //   return {
    //     opacity: opacity.value,
    //     transform: [
    //       { translateX: matrix[2] },
    //       { translateY: matrix[5] },
    //       { scaleX: matrix[0] },
    //       { scaleY: matrix[4] },
    //     ],
    //   };

    const timingConfig = {
      duration: isPinching.value ? 0 : 100,
      easing: Easing.ease,
    } as WithTimingConfig;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: withTiming(matrix[2], timingConfig) },
        { translateY: withTiming(matrix[5], timingConfig) },
        { scaleX: withTiming(matrix[0], timingConfig) },
        { scaleY: withTiming(matrix[4], timingConfig) },
      ],
    };
  });

  const gesturesCobined = Gesture.Exclusive(
    longPressGesture,
    Gesture.Simultaneous(pinch, pan)
  );

  return (
    <Div collapsable={false} className={`flex-1`}>
      <Div className="flex flex-1 flex-col items-center justify-center">
        <GestureDetector gesture={gesturesCobined}>
          <Animated.View
            ref={ref as any}
            collapsable={false}
            style={[
              {
                width: "100%",
                aspectRatio: 1,
                backgroundColor: "#f30429",
              },
              animatedStyle,
              filngStyle,
            ]}
          >
            <Animated.Image
              style={{ flex: 1 }}
              source={{
                uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
              }}
            ></Animated.Image>
          </Animated.View>
        </GestureDetector>
        {showModal && (
          <Div
            key={"modal"}
            collapsable={false}
            className="absolute w-48 bg-gray-200 pointer-events-none"
          >
            <Div className="flex flex-col justify-between items-center">
              {new Array(6).fill(0).map((_, i) => {
                let activeIndex = higlighted;
                if (higlighted > 5) {
                  activeIndex = 0;
                }

                if (i === 0) {
                  return (
                    <Animated.View
                      ref={elmRef as any}
                      key="kkk"
                      collapsable={false}
                    >
                      <T
                        key={i}
                        className={`font-normal p-4 text-sm ${
                          i === activeIndex ? "text-pink-600" : "text-white"
                        }`}
                      >
                        Release to cancel
                      </T>
                      <T>Choose collection</T>
                    </Animated.View>
                  );
                }

                return (
                  <T
                    key={i}
                    className={`font-extrabold p-3 text-xl ${
                      i === activeIndex
                        ? "text-red-600 bg-purple-400"
                        : "text-white"
                    }`}
                  >
                    --- arena {i} ---
                  </T>
                );
              })}
            </Div>
          </Div>
        )}
      </Div>
    </Div>
  );
};
