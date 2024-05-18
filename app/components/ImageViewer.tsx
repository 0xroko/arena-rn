import BottomSheet from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { MutableRefObject, createRef, useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolate,
  SharedValue,
  WithTimingConfig,
  interpolate,
  makeMutable,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Matrix3, identity3, multiply3 } from "react-native-redash";
import { create } from "zustand";

interface ImageBackgroundProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const ImageBackground = ({ children }: ImageBackgroundProps) => {
  const opacity = useImageViewerStore((state) => state.backgroundOpacity);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      opacity.value = withTiming(BACKDROP_OPACITY, {
        duration: 200,
      });
    }
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "black",
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        },
        style,
      ]}
    ></Animated.View>
  );
};

const delayConfig = {
  duration: 2000,
  easing: Easing.ease,
} as WithTimingConfig;

const originTimingConfig = {
  duration: 2000,
  easing: Easing.ease,
} as WithTimingConfig;

export const BACKDROP_OPACITY = 0.8;

export const createSharedValue = <T,>(init: T, oneWayReadsOnly = false) => {
  const ref = createRef<SharedValue<T>>();

  if (ref.current === null) {
    // @ts-ignore
    ref.current = makeMutable(init);
  }

  return ref.current as SharedValue<T>;
};
export interface BlockStoreExternal {
  sheetAnimatedPosition: SharedValue<number>;
  backgroundOpacity: SharedValue<number>;
  imageScale: SharedValue<number>;
  imageOpacity: SharedValue<number>;
  imageTranslationX: SharedValue<number>;
  sheetRef: MutableRefObject<BottomSheet | null>;
  setSheetRef: (ref: MutableRefObject<BottomSheet | null>) => void;
}

export const useImageViewerStore = create<BlockStoreExternal>((set, get) => ({
  sheetRef: createRef<BottomSheet>(),
  setSheetRef: (newRef) => {
    set(() => ({
      sheetRef: newRef,
    }));
  },
  sheetAnimatedPosition: createSharedValue(0),
  backgroundOpacity: createSharedValue(0),
  imageScale: createSharedValue(1),
  imageTranslationX: createSharedValue(0),
  imageOpacity: createSharedValue(0),
}));

function translateMatrix(matrix: Matrix3, x: number, y: number) {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
}

function scaleMatrix(matrox: Matrix3, value: number) {
  "worklet";
  return multiply3(matrox, [value, 0, 0, 0, value, 0, 0, 0, 1]);
}

export const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ImageViewerProps {
  children?: React.ReactNode | React.ReactNode[];
  initialImage: string;
  image?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onDismiss?: () => void;
  nextImage?: string;
  previousImage?: string;
  initialNextImage?: string;
  initialPreviousImage?: string;
}

export const ImageViewer = ({
  children,
  initialImage,
  image,
  initialNextImage,
  nextImage,
  initialPreviousImage,
  previousImage,
  onDismiss = () => {},
  onNext = () => {},
  onPrevious = () => {},
}: ImageViewerProps) => {
  const failOffset = 20;
  const failOffsetRange = [-failOffset, failOffset];
  const failOffsetOpposite = [-100, 100];
  const minDist = 20;
  const width = Dimensions.get("window").width;

  const isPinching = useSharedValue(false);
  const isPanning = useSharedValue(false);
  const pinchOrigin = useSharedValue({ x: 0, y: 0 });
  const pinchScale = useSharedValue(1);
  const pinchTranslation = useSharedValue({
    x: 0,
    y: 0,
  });
  const panTranslationX = useSharedValue(0);
  const panTranslationY = useSharedValue(0);
  const imageAnimatedRef = useAnimatedRef();
  const panScale = useSharedValue(1);

  const isTransitioning = useSharedValue(false);

  const sheetAnimatedPosition = useImageViewerStore(
    (s) => s.sheetAnimatedPosition
  );

  const sheetAnimatedPositionDerived = useDerivedValue(() => {
    if (sheetAnimatedPosition.value < 0) {
      return 0;
    }

    return sheetAnimatedPosition.value;
  });

  const DISABLED_NEXT = false; //  nextImage === undefined && initialNextImage === undefined;
  const DISABLED_PREVIOUS = false; //previousImage === undefined && initialPreviousImage === undefined;

  const sheetRef = useImageViewerStore((t) => t.sheetRef);
  const imageOpacity = useImageViewerStore((t) => t.imageOpacity);
  const backgroundOpacity = useImageViewerStore((t) => t.backgroundOpacity);

  const sheetForceClose = () => {
    if (sheetRef.current?.forceClose) {
      sheetRef.current?.forceClose({ duration: 200 });
    }
  };

  const sheetSnapToIndex = () => {
    if (sheetRef.current?.snapToIndex) {
      sheetRef.current?.snapToIndex(0, { duration: 200 });
    }
  };

  const IMAGE_TRANSITION_DURATION = 190;
  const PAN_DISSMISS_TRASHOLD = width * 0.09;

  const flingGestureDown = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .minPointers(1)
    .failOffsetX(failOffsetRange)
    .failOffsetY(failOffsetOpposite)
    .onStart((e) => {
      panTranslationY.value = 0;
      panTranslationX.value = 0;

      isPanning.value = true;
      panScale.value = 1;
      runOnJS(sheetForceClose)();
    })
    .onUpdate((e) => {
      if (isTransitioning.value) return;
      panTranslationY.value = e.translationY;
      panTranslationX.value = e.translationX;

      backgroundOpacity.value = interpolate(
        e.translationY,
        [0, width],
        [BACKDROP_OPACITY, 0],
        Extrapolate.CLAMP
      );

      imageOpacity.value = interpolate(
        e.translationY,
        [0, width * 0.3],
        [1, 0],
        Extrapolate.CLAMP
      );

      panScale.value = interpolate(
        e.translationY,
        [0, width * 0.4],
        [1, 0.7],
        Extrapolate.CLAMP
      );
    })
    .onEnd((e) => {
      if (e.translationY > PAN_DISSMISS_TRASHOLD) {
        isTransitioning.value = true;
        // runOnJS(dismissTimeout)();
        runOnJS(onDismiss)();

        panScale.value = withTiming(0, { duration: 120 });
        panTranslationY.value = withTiming(e.y + 800, { duration: 120 });
        panTranslationX.value = withTiming(e.x + 0, { duration: 120 });
        backgroundOpacity.value = withTiming(0, { duration: 120 });
        imageOpacity.value = withTiming(0, { duration: 120 });
      } else {
        runOnJS(sheetSnapToIndex)();

        backgroundOpacity.value = withTiming(BACKDROP_OPACITY, {
          duration: 100,
        });
        imageOpacity.value = withTiming(1, { duration: 100 });
        panTranslationX.value = withTiming(0, { duration: 100 });
        panTranslationY.value = withTiming(0, { duration: 100 });

        panScale.value = withTiming(1, { duration: 100 });
      }

      isPanning.value = false;
    });

  const VELOCITY_THRESHOLD = 1300;
  const TRANSLATION_THRESHOLD = width * 0.07;

  const beginOffset = useSharedValue(0);

  const flingGestureNext = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .cancelsTouchesInView(false)
    .minPointers(1)
    .failOffsetY(failOffsetRange)
    .failOffsetX(failOffsetOpposite)
    .onStart((e) => {
      beginOffset.value = panTranslationX.value;
      // nextBeginOffset.value = nextImageTranslationX.value;
      // prevBeginOffset.value = prevImageTranslationX.value;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      const realTrnaslationX = e.translationX + beginOffset.value;

      // const nextRealTranslationX = e.translationX + nextBeginOffset.value;
      // const prevRealTranslationX = e.translationX + prevBeginOffset.value;

      if (DISABLED_PREVIOUS && e.translationX > 0) {
        return;
      } else if (DISABLED_NEXT && e.translationX < 0) {
        return;
      } else if (e.translationX > 0) {
      } else if (e.translationX < 0) {
      }
      // nextImageTranslationX.value = nextRealTranslationX;
      // prevImageTranslationX.value = prevRealTranslationX;
      panTranslationX.value = realTrnaslationX;

      // scale.value = 1 - e.translationY / 300;
    })
    .onEnd((e) => {
      const realTrnaslationX = e.translationX + beginOffset.value;

      isPanning.value = false;
      if (
        (realTrnaslationX < -TRANSLATION_THRESHOLD ||
          e.velocityX < -VELOCITY_THRESHOLD) &&
        !DISABLED_NEXT &&
        isTransitioning.value === false
      ) {
        const measured = measure(imageAnimatedRef);

        isTransitioning.value = true;
        panTranslationX.value = withTiming(-measured.width, {
          duration: IMAGE_TRANSITION_DURATION,
        });
        // nextImageTranslationX.value = withTiming(-measured.width, {
        //   duration: IMAGE_TRANSITION_DURATION,
        // });
        // prevImageTranslationX.value = withTiming(-measured.width, {
        //   duration: IMAGE_TRANSITION_DURATION,
        // });

        runOnJS(onNext)();
      } else if (
        (realTrnaslationX > TRANSLATION_THRESHOLD ||
          e.velocityX > VELOCITY_THRESHOLD) &&
        !DISABLED_PREVIOUS &&
        isTransitioning.value === false
      ) {
        isTransitioning.value = true;

        const measured = measure(imageAnimatedRef);
        panTranslationX.value = withTiming(measured.width, {
          duration: IMAGE_TRANSITION_DURATION,
        });
        // prevImageTranslationX.value = withTiming(measured.width, {
        //   duration: IMAGE_TRANSITION_DURATION,
        // });
        // nextImageTranslationX.value = withTiming(measured.width, {
        //   duration: IMAGE_TRANSITION_DURATION,
        // });

        runOnJS(onPrevious)();
      } else {
        // if (realTrnaslationX > 0) {
        //   prevImageTranslationX.value = withTiming(0, {
        //     duration: IMAGE_TRANSITION_DURATION / 2,
        //   });
        // } else if (realTrnaslationX < 0) {
        //   nextImageTranslationX.value = withTiming(0, {
        //     duration: IMAGE_TRANSITION_DURATION / 2,
        //   });
        // }

        isTransitioning.value = true;

        // nextImageTranslationX.value = withTiming(0, {
        //   duration: IMAGE_TRANSITION_DURATION,
        // });
        // prevImageTranslationX.value = withTiming(0, {
        //   duration: IMAGE_TRANSITION_DURATION,
        // });
        panTranslationX.value = withTiming(
          0,
          {
            duration: IMAGE_TRANSITION_DURATION,
          },
          (e) => {
            isTransitioning.value = false;
          }
        );
      }
    });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      imageOpacity.value = withTiming(1, {
        duration: 200,
      });
    }
  }, []);

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      const measured = measure(imageAnimatedRef);

      isPinching.value = true;
      backgroundOpacity.value = withTiming(BACKDROP_OPACITY + 0.1, {
        duration: 300,
      });
      pinchOrigin.value = {
        x: event.focalX - measured.width / 2,
        y: event.focalY - measured.height / 2,
      };

      runOnJS(sheetForceClose)();
    })
    .onBegin((event) => {})
    .onChange((event) => {
      pinchScale.value = event.scale;
    })
    .onEnd(() => {
      backgroundOpacity.value = withTiming(BACKDROP_OPACITY, { duration: 200 });

      runOnJS(sheetSnapToIndex)();
      pinchScale.value = 1;
      isPinching.value = false;
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(2)
    .minPointers(2)
    .onStart((event) => {})
    .onChange((event) => {
      if (!isPinching.value) return;
      pinchTranslation.value = {
        x: event.translationX,
        y: event.translationY,
      };
    })
    .onEnd(() => {
      pinchTranslation.value = { x: 0, y: 0 };
      pinchOrigin.value = { x: 0, y: 0 };
    });

  const pinchStyle = useAnimatedStyle(() => {
    let matrix = identity3;
    if (pinchTranslation.value.x !== 0 || pinchTranslation.value.y !== 0) {
      matrix = translateMatrix(
        matrix,
        pinchTranslation.value.x,
        pinchTranslation.value.y
      );
    }

    if (pinchScale.value !== 1) {
      matrix = translateMatrix(
        matrix,
        pinchOrigin.value.x,
        pinchOrigin.value.y
      );
      matrix = scaleMatrix(matrix, pinchScale.value);
      matrix = translateMatrix(
        matrix,
        -pinchOrigin.value.x,
        -pinchOrigin.value.y
      );
    }

    let timingConfig = {
      duration: isPinching.value || isPanning.value ? 0 : 140,
      easing: Easing.ease,
    } as WithTimingConfig;

    let scaleFactor = 1;

    if (sheetAnimatedPositionDerived.value > 0.0) {
      timingConfig.duration = 0;
      scaleFactor = interpolate(
        sheetAnimatedPositionDerived.value,
        [0, 1],
        [1, 0.9],
        {
          extrapolateLeft: Extrapolate.CLAMP,
          extrapolateRight: Extrapolate.CLAMP,
        }
      );
    }

    if (isTransitioning.value) return {};

    return {
      transform: [
        { translateX: withTiming(matrix[2], timingConfig) },
        { translateY: withTiming(matrix[5], timingConfig) },
        {
          scaleX: withTiming(matrix[0] * scaleFactor, timingConfig),
        },
        {
          scaleY: withTiming(matrix[4] * scaleFactor, timingConfig),
        },
      ],
    };
  });

  const panStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,

      transform: [
        { translateX: panTranslationX.value },
        { translateY: panTranslationY.value },
        { scale: panScale.value },
      ],
    };
  });

  const gesturesCobined = Gesture.Exclusive(
    // longPressGesture,
    Gesture.Race(flingGestureDown),
    Gesture.Simultaneous(pinch, pan)
    // flingGesture
  );

  return (
    <GestureDetector gesture={gesturesCobined}>
      <Animated.View
        collapsable={false}
        style={[
          {
            height: "80%",
            flexDirection: "row",
          },
        ]}
      >
        <AnimatedImage
          ref={imageAnimatedRef as any}
          placeholderContentFit="contain"
          style={[
            {
              flex: 1,
              zIndex: 77,
            },
            pinchStyle,
            panStyle,
          ]}
          contentFit={"contain"}
          placeholder={{
            uri: initialImage,
          }}
          source={{
            uri: image,
          }}
        ></AnimatedImage>
      </Animated.View>
    </GestureDetector>
  );
};
