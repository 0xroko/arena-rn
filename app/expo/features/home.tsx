import BottomSheet from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolate,
  SharedValue,
  WithTimingConfig,
  interpolate,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Matrix3, clamp, identity3, multiply3 } from "react-native-redash";
import { useQuery } from "react-query";
import { Routes } from "../App";
import {
  AnimatedImage,
  Block,
  Div,
  T,
  blockFetcher,
  useBlockStore,
  useExploreState,
} from "./shared";

const useBlock = (blockId: string) => {
  return useQuery(["block", blockId], () => blockFetcher(blockId));
};

function translateMatrix(matrix: Matrix3, x: number, y: number) {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
}

function scaleMatrix(matrox: Matrix3, value: number) {
  "worklet";
  return multiply3(matrox, [value, 0, 0, 0, value, 0, 0, 0, 1]);
}

interface ImageViewerProps {
  children?: React.ReactNode | React.ReactNode[];
  initialImage: string;
  image?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onDismiss?: () => void;
  externalScale?: SharedValue<number>;
  nextImage?: string;
  previousImage?: string;
  initialNextImage?: string;
  initialPreviousImage?: string;
  animateOnMount?: boolean;
}

export const ImageViewer = ({
  children,
  initialImage,
  image,
  onDismiss,
  onNext,
  animateOnMount,
  onPrevious,
  nextImage,
  initialNextImage,
  initialPreviousImage,
  previousImage,
}: ImageViewerProps) => {
  const activeB = 20;
  const toActive = [-activeB, activeB];
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
  const nextImageTranslationX = useSharedValue(0);
  const nextImageTranslationY = useSharedValue(0);
  const prevImageTranslationX = useSharedValue(0);
  const panTranslationX = useSharedValue(0);
  const panTranslationY = useSharedValue(0);
  const ref = useAnimatedRef();

  const imageOpacity = useSharedValue(animateOnMount ? 0 : 1);

  useEffect(() => {
    imageOpacity.value = withTiming(1, { duration: 100 });
  }, []);

  const timeout = (fn: () => void | undefined, ms: number) => {
    return () => {
      setTimeout(() => {
        fn();
      }, ms);
    };
  };

  const onNextTimeout = timeout(onNext, 120);

  const onPreviousTimeout = timeout(onPrevious, 120);

  const dismissTimeout = timeout(onDismiss, 120);

  const PAN_DISSMISS_TRASHOLD = width * 0.3;

  const flingGestureDown = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .minPointers(1)
    .failOffsetX(toActive)
    .onStart((e) => {
      panTranslationY.value = 0;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      panTranslationY.value = e.translationY;
      pinchScale.value = 1 - e.translationY / 30;
    })
    .onEnd((e) => {
      if (e.translationY > PAN_DISSMISS_TRASHOLD) {
        // backgroundOpacity.value = withTiming(0, { duration: 100 });
        pinchScale.value = withTiming(0.3, { duration: 100 });
        panTranslationY.value = withTiming(e.y + 400, { duration: 100 });
        // runOnJS(forceCloseSheet)({ duration: 100 });
        runOnJS(dismissTimeout)();
      } else {
        isPanning.value = false;
        panTranslationY.value = withTiming(0, { duration: 100 });
        pinchScale.value = 1;
      }
    });

  const TRANSLATION_TRASHOLD = width * 0.5;
  const VELOCITY_TRASHOLD = 1500;

  const flingGestureNext = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .minPointers(1)
    .failOffsetY(toActive)
    .onStart((e) => {
      panTranslationX.value = 0;
      nextImageTranslationX.value = 0;
      prevImageTranslationX.value = 0;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      panTranslationX.value = e.translationX;
      nextImageTranslationX.value = e.translationX;
      prevImageTranslationX.value = e.translationX;

      // scale.value = 1 - e.translationY / 300;
    })
    .onEnd((e) => {
      if (
        -e.translationX > TRANSLATION_TRASHOLD ||
        e.velocityX < -VELOCITY_TRASHOLD
      ) {
        const measured = measure(ref);
        panTranslationX.value = withTiming(-measured.width, { duration: 100 });
        nextImageTranslationX.value = withTiming(-measured.width, {
          duration: 100,
        });
        runOnJS(onNextTimeout)();
      } else if (
        e.translationX > TRANSLATION_TRASHOLD ||
        e.velocityX > VELOCITY_TRASHOLD
      ) {
        const measured = measure(ref);
        panTranslationX.value = withTiming(measured.width, { duration: 100 });
        prevImageTranslationX.value = withTiming(measured.width, {
          duration: 100,
        });

        runOnJS(onPreviousTimeout)();
      } else {
        nextImageTranslationX.value = withTiming(0, { duration: 100 });
        prevImageTranslationX.value = withTiming(0, { duration: 100 });
        panTranslationX.value = withTiming(0, { duration: 100 });
      }
    });

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      const measured = measure(ref);
      isPinching.value = true;

      pinchOrigin.value = {
        x: event.focalX - measured.width / 2,
        y: event.focalY - measured.height / 2,
      };
    })
    .onBegin((event) => {})
    .onChange((event) => {
      pinchScale.value = event.scale;
    })
    .onEnd(() => {
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
      duration: isPinching.value || isPanning.value ? 0 : 100,
      easing: Easing.ease,
    } as WithTimingConfig;

    let scaleFactor = 1;
    // let scaleFactor = interpolate(sheetAnimatedIndex.value, [0, 1], [1, 0.9], {
    //   extrapolateLeft: Extrapolate.CLAMP,
    //   extrapolateRight: Extrapolate.CLAMP,
    // });

    if (isPinching.value) scaleFactor = 1;

    if (scaleFactor < 1) {
      timingConfig.duration = 0;
    }

    return {
      opacity: imageOpacity.value,
      transform: [
        { translateX: withTiming(matrix[2], timingConfig) },
        { translateY: withTiming(matrix[5], timingConfig) },
        {
          scaleX: withTiming(
            clamp(matrix[0] * scaleFactor, 0.5, 10),
            timingConfig
          ),
        },
        {
          scaleY: withTiming(
            clamp(matrix[4] * scaleFactor, 0.5, 10),
            timingConfig
          ),
        },
      ],
    };
  });

  const panStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: panTranslationX.value },
        { translateY: panTranslationY.value },
      ],
    };
  });

  const nextImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: nextImageTranslationX.value },
        { translateY: nextImageTranslationY.value },
      ],
    };
  });

  const prevImageStyle = useAnimatedStyle(() => {
    // const measured = measure(ref);
    return {
      transform: [{ translateX: -width + prevImageTranslationX.value }],
    };
  });

  const gesturesCobined = Gesture.Exclusive(
    // longPressGesture,
    Gesture.Race(flingGestureNext, flingGestureDown),
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
            width: "200%",
            flexDirection: "row",
          },
        ]}
      >
        <AnimatedImage
          ref={ref as any}
          placeholderContentFit="contain"
          style={[
            {
              flex: 1,
              zIndex: 77,
              top: 0,
              left: 0,
              height: "100%",

              position: "absolute",
              width: "50%",
            },
            prevImageStyle,
          ]}
          contentFit={"contain"}
          placeholder={{
            uri: initialPreviousImage,
          }}
          source={{
            // uri: block ? block.image_url : initialImageUrl,
            // uri: block?.image_url,
            uri: previousImage,
            // uri: "https://d2w9rnfcy7mm78.cloudfront.net/6651769/original_049ed5752c0df4cfc123a37120132c37.jpg?1585600664?bc=0 ",
            // uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
          }}
        ></AnimatedImage>
        <AnimatedImage
          ref={ref as any}
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
            // uri: block ? block.image_url : initialImageUrl,
            // uri: block?.image_url,
            uri: image,
            // uri: "https://d2w9rnfcy7mm78.cloudfront.net/6651769/original_049ed5752c0df4cfc123a37120132c37.jpg?1585600664?bc=0 ",
            // uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
          }}
        ></AnimatedImage>
        <AnimatedImage
          placeholderContentFit="contain"
          style={[
            {
              flex: 1,
              zIndex: 77,
            },
            nextImageStyle,
            // pinchStyle,
          ]}
          contentFit={"contain"}
          placeholder={{
            uri: nextImage,
          }}
          source={{
            // uri: block ? block.image_url : initialImageUrl,
            // uri: route.params.other.next.initialImageUrl,
            uri: nextImage,
            // uri: "https://d2w9rnfcy7mm78.cloudfront.net/6651769/original_049ed5752c0df4cfc123a37120132c37.jpg?1585600664?bc=0 ",
            // uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
          }}
        ></AnimatedImage>
      </Animated.View>
    </GestureDetector>
  );
};

interface ImageBackgroundProps {
  children?: React.ReactNode | React.ReactNode[];
  opacity?: SharedValue<number>;
}

export const ImageBackground = ({
  children,
  opacity,
}: ImageBackgroundProps) => {
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

interface BlockInfoProps {
  children?: React.ReactNode | React.ReactNode[];
  block?: Block;
  animateOnMount?: boolean;
}

export const BlockInfoSheet = forwardRef(
  ({ children, block, animateOnMount }: BlockInfoProps, sheetRef: any) => {
    const data = [
      {
        option: "share",
        title: "Share",
      },
      {
        option: "find-original",
        title: "Find original",
      },
      {
        option: "download",
        title: "Download",
      },
      {
        option: "mute",
        title: "Mute",
      },
    ] as const;

    // callbacks

    const renderItem = useCallback(
      (item: typeof data[0]) => (
        <Div key={item.option} className={`px-0 my-1 mx-2`}>
          <T className={`text-white font-bold`}>{item.title}</T>
        </Div>
      ),
      []
    );
    const sheetAnimatedIndex = useSharedValue(0);
    const sheetAnimatedPosition = useSharedValue(0);

    const initialSnapPoints = useMemo(() => ["25%", "50%"], []);
    return (
      <BottomSheet
        backgroundStyle={{ backgroundColor: "black" }}
        backdropComponent={({ animatedIndex, animatedPosition }) => {
          const containerAnimatedStyle = useAnimatedStyle(() => ({
            opacity: interpolate(
              animatedIndex.value,
              [0, 1],
              [0, 0.4],
              Extrapolate.CLAMP
            ),
          }));
          return (
            <Pressable
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
              onPress={() => {
                sheetRef.current?.snapToIndex(0);
              }}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: "black",
                    flex: 1,
                  },
                  containerAnimatedStyle,
                ]}
              />
            </Pressable>
          );
        }}
        handleIndicatorStyle={{
          backgroundColor: "white",
        }}
        handleStyle={{
          // backgroundColor: "red",
          paddingTop: 12,
          paddingBottom: 28,
        }}
        animatedIndex={sheetAnimatedIndex}
        animatedPosition={sheetAnimatedPosition}
        index={0}
        animateOnMount={animateOnMount}
        ref={sheetRef}
        snapPoints={initialSnapPoints}
      >
        <Div className={`px-5 pb-5`}>
          <Div className={`text-ellipsis`}>
            <T className={`text-white text-lg font-bold `}>{block?.title}</T>
            <T className={`text-[#6e6e6e] text-sm mt-3`}>
              Added {block?.created_at} by{" "}
              <T className={`font-bold`}>{block?.user?.name}</T>
            </T>
            <T className={`text-[#6e6e6e] text-sm`}>
              Last updated {block?.updated_at}
            </T>
            <T className={`text-[#6e6e6e] text-sm`}>
              {block?.source?.title ? "Source: " : "Source"}
              {block?.source?.title}
            </T>
          </Div>
          <Div
            className={`border-[#6e6e6e] flex-row justify-between my-2 border-b-2`}
          >
            <T className={`text-[#6e6e6e] m-2`}>Actions</T>
            <T className={`text-[#6e6e6e] m-2 font-bold`}>Flag</T>
          </Div>
          {data.map(renderItem)}
        </Div>
      </BottomSheet>
    );
  }
);

interface ImageBlockViewerProps {
  children?: React.ReactNode | React.ReactNode[];
  blockId: number;
  initialImageUrl: string;
}

export const ImageBlockViewer = ({
  children,
  blockId,
  initialImageUrl,
}: ImageBlockViewerProps) => {
  const blockStore = useBlockStore();

  //const {block, next(), previous()} = useCollectionState(id: string, inititalBlock: BasicImageBlock)
  const { next, previous, current, prefetchBlock } = useExploreState(
    blockStore.currentBlock.toString()
  );

  console.log("next", blockStore.currentBlock.toString());
  const backgroundOpacity = useSharedValue(0);

  const { data: block, isLoading } = useBlock(
    blockStore.currentBlock.toString()
  );

  useEffect(() => {
    backgroundOpacity.value = withTiming(0.8, { duration: 100 });
    blockStore.setMounted(true);
  }, []);

  useEffect(() => {
    const p = async () => {
      await Promise.all([prefetchBlock(next?.id), prefetchBlock(previous?.id)]);
    };
    p();
  }, [blockStore.currentBlock]);

  const sheetAnimatedIndex = useSharedValue(0);
  const sheetRef = useRef<BottomSheet>(null);
  const route = useNavigation();

  return (
    <Div className={`flex-1`}>
      <ImageBackground opacity={backgroundOpacity} />

      <ImageViewer
        initialImage={current?.src_3x}
        previousImage={previous?.src}
        nextImage={next?.src}
        animateOnMount={!blockStore.mounted}
        initialPreviousImage={previous?.src_3x}
        initialNextImage={next?.src_3x}
        key={current?.id}
        onDismiss={() => {
          route.goBack();
          blockStore.setMounted(false);
        }}
        onNext={() => {
          console.log("onNext");
          blockStore.setCurrentBlock(next?.id);
        }}
        onPrevious={() => {
          blockStore.setCurrentBlock(previous?.id);
        }}
        image={block?.image_url}
      />
      <BlockInfoSheet
        ref={sheetRef}
        block={block}
        animateOnMount={!blockStore.mounted}
      />
    </Div>
  );
};

export const Home: FC<NativeStackScreenProps<Routes, "Home">> = ({
  navigation,
  route,
}) => {
  return (
    <ImageBlockViewer
      blockId={route.params.blockId}
      initialImageUrl={route.params.initialImageUrl}
    />
  );
};

export const Home2: FC<NativeStackScreenProps<Routes, "Home">> = ({
  navigation,
  route,
}) => {
  const { blockId, initialImageUrl } = route.params;

  const from = route.params.from;
  console.log("FROM", from);

  const { data: block, isLoading } = useBlock(blockId as any);

  const sheetAnimatedIndex = useSharedValue(0);
  const sheetAnimatedPosition = useSharedValue(0);

  const initialSnapPoints = useMemo(() => ["25%", "50%"], []);

  const backgroundOpacity = useSharedValue(from === "Explore" ? 0 : 1);

  const ref = useAnimatedRef();

  const elmRef = useAnimatedRef();
  const origin = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);
  const translation = useSharedValue({
    x: 0,
    y: 0,
  });

  const isPinching = useSharedValue(false);
  // const transform = useSharedValue(identity3);
  const opacity = useSharedValue(from === "Explore" ? 0 : 1);
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (from === "Explore") {
      opacity.value = withTiming(1, { duration: 200 });
      backgroundOpacity.value = withTiming(1, { duration: 200 });
    }
  }, []);

  const isPanning = useSharedValue(false);

  const forceCloseSheet = sheetRef?.current?.forceClose;

  const [showModal, setShowModal] = useState(false);

  const [higlighted, setHighlighted] = useState(-1);
  const position = useSharedValue(0);
  const positionNext = useSharedValue(0);

  const popTimouted = () => {
    setTimeout(() => {
      navigation.pop();
    }, 100);
  };

  const timingDuration = useSharedValue(0);

  const nextImageTransform = useSharedValue({ x: 0, y: 0 });

  const nextImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: nextImageTransform.value.x },
        { translateY: nextImageTransform.value.y },
      ],
    };
  });

  // const flingGesture = Gesture.Fling()
  //   .direction(Directions.DOWN)
  //   .numberOfPointers(1)
  //   .onStart((e) => {})
  //   .onEnd((e) => {
  //     console.log("fling");
  //     backgroundOpacity.value = withTiming(0, { duration: 100 });
  //     position.value = withSequence(
  //       withTiming(position.value + 50, { duration: 100 }, (e) => {
  //         e && runOnJS(navigation.pop)();
  //         e && runOnJS(forceCloseSheet)({ duration: 100 });
  //       }),
  //       withTiming(0, { duration: 100 })
  //     );
  //     // runOnJS(setShowModal)(true);
  //   });

  const minDist = 20;
  const activeB = 20;
  const toActive = [-activeB, activeB];

  const nextPage = () => {
    console.log("next22");
    setTimeout(() => {
      navigation.replace("Home", {
        blockId: route.params.other.next?.blockId,
        initialImageUrl: route.params.other.next?.initialImageUrl,
        from: "Home",
        other: {
          next: {
            blockId: route.params.other.next?.blockId,
            initialImageUrl: route.params.other.next?.initialImageUrl,
          },
        },
      });
    }, 120);
  };

  const flingGestureDown = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .minPointers(1)
    .failOffsetX(toActive)
    .onStart((e) => {
      position.value = 0;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      position.value = e.translationY;
      scale.value = 1 - e.translationY / 1000;
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        console.log("dissmiss");

        backgroundOpacity.value = withTiming(0, { duration: 100 });
        scale.value = withTiming(0.3, { duration: 100 });
        position.value = withTiming(700, { duration: 100 });

        runOnJS(forceCloseSheet)({ duration: 100 });
        runOnJS(popTimouted)();
      } else {
        isPanning.value = false;
        position.value = 0;
        scale.value = 1;
      }
    });

  const flingGestureNext = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .minPointers(1)
    .failOffsetY(toActive)
    .onStart((e) => {
      positionNext.value = 0;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      nextImageTransform.value.x = -e.translationX;
      positionNext.value = e.translationX;
      // scale.value = 1 - e.translationY / 300;
    })
    .onEnd((e) => {
      if (-e.translationX > 50) {
        console.log("next");
        const measured = measure(ref);
        positionNext.value = withTiming(-measured.width, { duration: 100 });
        nextImageTransform.value.x = withTiming(measured.width, {
          duration: 100,
        });
        runOnJS(nextPage)();
      } else {
        positionNext.value = withTiming(0, { duration: 100 });
      }
    });

  const filngStyle = useAnimatedStyle(() => {
    return {
      // testing inace Y
      transform: [
        { translateY: position.value },
        { translateX: positionNext.value },
      ],
    };
  });

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      timingDuration.value = 0;

      const measured = measure(ref);
      isPinching.value = true;

      origin.value = {
        x: event.focalX - measured.width / 2,
        y: event.focalY - measured.height / 2,
      };
    })
    .onBegin((event) => {})
    .onChange((event) => {
      // animatedContentHeight.value = 45;
      // SCALE
      scale.value = event.scale;
    })
    .onEnd(() => {
      timingDuration.value = 100;
      // let matrix = identity3;
      scale.value = 1;
      // matrix = translateMatrix(matrix, origin.value.x, origin.value.y);
      // matrix = scaleMatrix(matrix, scale.value);
      // matrix = translateMatrix(matrix, -origin.value.x, -origin.value.y);
      // transform.value = multiply3(matrix, transform.value);
      isPinching.value = false;
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(2)
    .minPointers(2)
    .onStart((event) => {})
    .onChange((event) => {
      if (!isPinching.value) return;
      translation.value = {
        x: event.translationX,
        y: event.translationY,
      };
    })
    .onEnd(() => {
      // let matrix = identity3;
      translation.value = { x: 0, y: 0 };
      origin.value = { x: 0, y: 0 };

      // matrix = translateMatrix(
      //   matrix,
      //   translation.value.x,
      //   translation.value.y
      // );
      // transform.value = multiply3(matrix, transform.value);
    });

  const sharedIndex = useSharedValue(-1);

  const longPressGesture = Gesture.Pan()
    .onStart((e) => {
      // isLongPressing.value = true;
      // runOnJS(setShowModal)(true);/
      // sharedIndex.value = Math.round(e.y / 45);
    })
    .onEnd((e) => {
      // isLongPressing.value = false;
      // runOnJS(setShowModal)(false);
    })
    .onFinalize((e) => {})
    .onUpdate((e) => {
      // let beg = clamp(e.y - 100, 100, 300);
      // let h = 45;
      // sharedIndex.value = Math.round(beg / h) - 1;
    })
    .maxPointers(1)
    .minPointers(1)
    .activateAfterLongPress(1000);

  useDerivedValue(() => {
    runOnJS(setHighlighted)(sharedIndex.value);
  }, [sharedIndex.value]);

  const [isPinchingState, setIsPinchingState] = useState(false);

  const imageRef = useAnimatedRef();

  useDerivedValue(() => {
    runOnJS(setIsPinchingState)(isPinching.value);
  }, [isPinching.value]);

  // useDerivedValue(() => {
  // console.log("sheetAnimatedPosition.value", sheetAnimatedIndex.value);
  // if (between(sheetAnimatedIndex.value, 0.001, 0.999)) {
  //   timingDuration.value = 44;
  //   scale.value = interpolate(
  //     sheetAnimatedIndex.value,
  //     [0.001, 0.999],
  //     [1, 0.9],
  //     {
  //       extrapolateLeft: Extrapolate.CLAMP,
  //       extrapolateRight: Extrapolate.CLAMP,
  //     }
  //   );
  // }
  // }, [sheetAnimatedPosition.value]);

  useEffect(() => {
    if (isPinchingState) {
      sheetRef.current.snapToPosition(0, {
        duration: 200,
      });
    } else {
      sheetRef.current.snapToIndex(0);
    }
  }, [isPinchingState]);

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

    let timingConfig = {
      duration:
        isPinching.value || isPanning.value ? 0 : scale.value < 1 ? 34 : 100,
      easing: Easing.ease,
    } as WithTimingConfig;

    let scaleFactor = interpolate(sheetAnimatedIndex.value, [0, 1], [1, 0.9], {
      extrapolateLeft: Extrapolate.CLAMP,
      extrapolateRight: Extrapolate.CLAMP,
    });

    if (isPinching.value) scaleFactor = 1;

    if (scaleFactor < 1) {
      timingConfig.duration = 0;
    }

    return {
      opacity: opacity.value,
      transform: [
        { translateX: withTiming(matrix[2], timingConfig) },
        { translateY: withTiming(matrix[5], timingConfig) },
        {
          scaleX: withTiming(
            clamp(matrix[0] * scaleFactor, 0.5, 10),
            timingConfig
          ),
        },
        {
          scaleY: withTiming(
            clamp(matrix[4] * scaleFactor, 0.5, 10),
            timingConfig
          ),
        },
      ],
    };
  });

  const gesturesCobined = Gesture.Exclusive(
    // longPressGesture,
    Gesture.Race(flingGestureNext, flingGestureDown),
    Gesture.Simultaneous(pinch, pan)

    // flingGesture
  );

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });
  const data = [
    {
      option: "share",
      title: "Share",
    },
    {
      option: "find-original",
      title: "Find original",
    },
    {
      option: "download",
      title: "Download",
    },
    {
      option: "mute",
      title: "Mute",
    },
  ] as const;

  // callbacks

  const renderItem = useCallback(
    (item: typeof data[0]) => (
      <Div key={item.option} className={`px-0 my-1 mx-2`}>
        <T className={`text-white font-bold`}>{item.title}</T>
      </Div>
    ),
    []
  );

  useEffect(() => {
    let t;

    navigation.addListener("beforeRemove", (e) => {
      if ((e.data.action.payload as any)?.name === "Home") {
        return;
      } else {
        e.preventDefault();
        console.log("beforeRemove");

        backgroundOpacity.value = withTiming(0, { duration: 100 });
        (position.value = withTiming(
          position.value + 50,
          { duration: 100 },
          (e) => {}
        )),
          (opacity.value = withTiming(0, { duration: 200 }, () => {}));
        t = setTimeout(() => {
          navigation.dispatch(e.data.action);
        }, 200);
      }
    });

    return () => {
      console.log("unmounted");

      clearTimeout(t);
      navigation.removeListener("beforeRemove", () => {});
    };
  }, []);

  return (
    <Animated.View
      style={[{ flex: 1, backgroundColor: "#00000044" }, backgroundStyle]}
      collapsable={false}
    >
      <Div className="flex relative flex-1 flex-col justify-start">
        <GestureDetector gesture={gesturesCobined}>
          <Animated.View
            collapsable={false}
            style={[
              {
                height: "80%",
                width: "200%",
                flexDirection: "row",
                // backgroundColor: "pink",
              },
              filngStyle,
            ]}
          >
            <AnimatedImage
              ref={ref as any}
              placeholderContentFit="contain"
              recyclingKey={block?.image_url + "current"}
              style={[{ flex: 1, zIndex: 77 }, animatedStyle]}
              contentFit={"contain"}
              placeholder={{
                uri: initialImageUrl,
              }}
              source={{
                // uri: block ? block.image_url : initialImageUrl,
                uri: block?.image_url,
                // uri: initialImageUrl,
                // uri: "https://d2w9rnfcy7mm78.cloudfront.net/6651769/original_049ed5752c0df4cfc123a37120132c37.jpg?1585600664?bc=0 ",
                // uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
              }}
            ></AnimatedImage>
            <AnimatedImage
              recyclingKey={route.params.other.next.initialImageUrl + "next"}
              placeholderContentFit="contain"
              style={[
                {
                  flex: 1,
                  zIndex: 77,
                },
                // animatedStyle,
                nextImageStyle,
              ]}
              contentFit={"contain"}
              // placeholder={{
              //   uri: initialImageUrl,
              // }}
              source={{
                // uri: block ? block.image_url : initialImageUrl,
                uri: route.params.other.next.initialImageUrl,
                // uri: initialImageUrl,
                // uri: "https://d2w9rnfcy7mm78.cloudfront.net/6651769/original_049ed5752c0df4cfc123a37120132c37.jpg?1585600664?bc=0 ",
                // uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
              }}
            ></AnimatedImage>
            {/* <Img
              placeholderContentFit="contain"
              style={{ flex: 1, marginHorizontal: 6, zIndex: 77 }}
              contentFit={"contain"}
              placeholder={{
                uri: initialImageUrl,
              }}
              source={{
                // uri: block ? block.image_url : initialImageUrl,
                // uri: block?.image_url,
                // uri: initialImageUrl,
                uri: "https://d2w9rnfcy7mm78.cloudfront.net/6651769/original_049ed5752c0df4cfc123a37120132c37.jpg?1585600664?bc=0 ",
                // uri: "https://t2.genius.com/unsafe/1000x1000/https%3A%2F%2Fimages.genius.com%2F7cf1f8cf1fc63990f3bcd02fe5d52be7.1000x1000x1.png",
              }}
            ></Img> */}
          </Animated.View>
        </GestureDetector>

        {showModal && (
          <Div
            key={"modal"}
            collapsable={false}
            className="absolute w-48 bg-black border-2 pointer-events-none"
          >
            <Div className="flex flex-col justify-between items-center">
              {new Array(7).fill(0).map((_, i) => {
                let activeIndex = higlighted;
                if (higlighted > 6) {
                  activeIndex = 6;
                }

                if (i === 0 || i === 6) {
                  return (
                    <Div
                      className={`text-center flex justify-center items-center`}
                      ref={elmRef as any}
                      key={i + "a"}
                      collapsable={false}
                    >
                      <T
                        className={`font-normal p-4 text-sm ${
                          i === activeIndex ? "text-white" : "text-[#2f2f2f]"
                        }`}
                      >
                        Release to cancel
                      </T>
                    </Div>
                  );
                }

                return (
                  <T
                    key={i}
                    className={`font-semibold py-2 px-3 text-lg ${
                      i === activeIndex
                        ? "text-white border border-white z-30"
                        : "text-[#2f2f2f] border border-black"
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
      <BottomSheet
        backgroundStyle={{ backgroundColor: "black" }}
        backdropComponent={({ animatedIndex, animatedPosition }) => {
          const containerAnimatedStyle = useAnimatedStyle(() => ({
            opacity: interpolate(
              animatedIndex.value,
              [0, 1],
              [0, 0.4],
              Extrapolate.CLAMP
            ),
          }));
          return (
            <Pressable
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
              onPress={() => {
                sheetRef.current?.snapToIndex(0);
              }}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: "black",
                    flex: 1,
                  },
                  containerAnimatedStyle,
                ]}
              />
            </Pressable>
          );
        }}
        handleIndicatorStyle={{
          backgroundColor: "white",
        }}
        handleStyle={{
          // backgroundColor: "red",
          paddingTop: 12,
          paddingBottom: 28,
        }}
        animatedIndex={sheetAnimatedIndex}
        animatedPosition={sheetAnimatedPosition}
        index={0}
        animateOnMount={from === "Explore"}
        ref={sheetRef}
        snapPoints={initialSnapPoints}
      >
        <Div className={`px-5 pb-5`}>
          <Div className={`text-ellipsis`}>
            <T className={`text-white text-lg font-bold `}>{block?.title}</T>
            <T className={`text-[#6e6e6e] text-sm mt-3`}>
              Added {block?.created_at} by{" "}
              <T className={`font-bold`}>{block?.user?.name}</T>
            </T>
            <T className={`text-[#6e6e6e] text-sm`}>
              Last updated {block?.updated_at}
            </T>
            <T className={`text-[#6e6e6e] text-sm`}>
              {block?.source?.title ? "Source: " : "Source"}
              {block?.source?.title}
            </T>
          </Div>
          <Div
            className={`border-[#6e6e6e] flex-row justify-between my-2 border-b-2`}
          >
            <T className={`text-[#6e6e6e] m-2`}>Actions</T>
            <T className={`text-[#6e6e6e] m-2 font-bold`}>Flag</T>
          </Div>
          {data.map(renderItem)}
        </Div>
      </BottomSheet>
    </Animated.View>
  );
};
function useCardAnimation(): { current: any } {
  throw new Error("Function not implemented.");
}
