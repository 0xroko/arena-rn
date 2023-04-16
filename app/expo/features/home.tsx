import BottomSheet from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  FC,
  createRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Dimensions, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolate,
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
import { Matrix3, identity3, multiply3 } from "react-native-redash";
import { useQuery } from "react-query";
import { useStore } from "zustand";
import { Routes } from "../App";
import {
  AnimatedImage,
  BACKDROP_OPACITY,
  Block,
  BlockStore,
  Div,
  T,
  blockFetcher,
  createBlockStore,
  createSharedValue,
  useExploreState,
} from "./shared";

const useBlock = (blockId: string) => {
  return useQuery(["block", blockId?.toString()], () => blockFetcher(blockId), {
    staleTime: 60000,
    refetchOnMount: false,
  });
};

function translateMatrix(matrix: Matrix3, x: number, y: number) {
  "worklet";
  return multiply3(matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
}

function scaleMatrix(matrox: Matrix3, value: number) {
  "worklet";
  return multiply3(matrox, [value, 0, 0, 0, value, 0, 0, 0, 1]);
}

export const useImageViewer = createBlockStore({
  sheetRef: createRef<BottomSheet>(),
  sheetAnimatedPosition: createSharedValue(0),
  backgroundOpacity: createSharedValue(0),
  imageScale: createSharedValue(1),
  imageTranslationX: createSharedValue(0),
  imageOpacity: createSharedValue(0),
});

export const useImageViewerStore = <T,>(
  selector?: (state: BlockStore) => T
): T => useStore(useImageViewer, selector);

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
  onDismiss,
  onNext,
  onPrevious,
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
  const nextImageTranslationX = useSharedValue(0);
  const prevImageTranslationX = useSharedValue(0);
  const panTranslationX = useSharedValue(0);
  const panTranslationY = useSharedValue(0);
  const imageAnimatedRef = useAnimatedRef();
  const panScale = useSharedValue(1);

  const isTransitioning = useSharedValue(false);

  const sheetAnimatedPosition = useImageViewerStore(
    (t) => t.sheetAnimatedPosition
  );

  const sheetAnimatedPositionDerived = useDerivedValue(() => {
    if (sheetAnimatedPosition.value < 0) {
      return 0;
    }

    return sheetAnimatedPosition.value;
  });

  const DISABLED_NEXT =
    nextImage === undefined && initialNextImage === undefined;
  const DISABLED_PREVIOUS =
    previousImage === undefined && initialPreviousImage === undefined;

  const sheetRef = useImageViewerStore((t) => t.sheetRef);
  const imageOpacity = useImageViewerStore((t) => t.imageOpacity);
  const backgroundOpacity = useImageViewerStore((t) => t.backgroundOpacity);

  const sheetForceClose = sheetRef.current?.forceClose;
  const sheetSnapToIndex = sheetRef.current?.snapToIndex;

  const cancelTimeoutAndStop = () => {
    if (timeoutRef.current) {
      console.log("timeout cleared", timeoutRef.current);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const timeout = (fn: () => void | undefined, ms: number) => {
    return () => {
      if (timeoutRef.current) {
        cancelTimeoutAndStop();
      } else {
        timeoutRef.current = setTimeout(() => {
          fn();
        }, ms);
        console.log("timeout scheduled", timeoutRef.current);
      }
    };
  };

  const IMAGE_TRANSITION_DURATION = 190;
  const PAN_DISSMISS_TRASHOLD = width * 0.09;

  const onNextTimeout = timeout(onNext, IMAGE_TRANSITION_DURATION - 30);
  const onPreviousTimeout = timeout(onPrevious, IMAGE_TRANSITION_DURATION - 30);
  const dismissTimeout = timeout(onDismiss, 120);

  const flingGestureDown = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .minPointers(1)
    .failOffsetX(failOffsetRange)
    .failOffsetY(failOffsetOpposite)
    .onStart((e) => {
      panTranslationY.value = 0;
      isPanning.value = true;
      panScale.value = 1;
      runOnJS(sheetForceClose)({ duration: 100 });
    })
    .onUpdate((e) => {
      if (isTransitioning.value) return;
      panTranslationY.value = e.translationY;

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
        "clamp"
      );
    })
    .onEnd((e) => {
      isTransitioning.value = true;

      if (e.translationY > PAN_DISSMISS_TRASHOLD) {
        runOnJS(dismissTimeout)();

        panScale.value = withTiming(0, { duration: 120 });
        panTranslationY.value = withTiming(e.y + 400, { duration: 120 });
        backgroundOpacity.value = withTiming(0, { duration: 120 });
        imageOpacity.value = withTiming(0, { duration: 120 });
      } else {
        runOnJS(sheetSnapToIndex)(0, { duration: 100 });

        backgroundOpacity.value = withTiming(BACKDROP_OPACITY, {
          duration: 100,
        });
        imageOpacity.value = withTiming(1, { duration: 100 });
        panTranslationY.value = withTiming(0, { duration: 100 });
        panScale.value = withTiming(1, { duration: 100 });
      }

      isPanning.value = false;
    });

  const VELOCITY_THRESHOLD = 1300;
  const TRANSLATION_THRESHOLD = width * 0.07;

  const beginOffset = useSharedValue(0);
  const nextBeginOffset = useSharedValue(0);
  const prevBeginOffset = useSharedValue(0);

  const flingGestureNext = Gesture.Pan()
    .minDistance(minDist)
    .maxPointers(1)
    .cancelsTouchesInView(false)
    .minPointers(1)
    .failOffsetY(failOffsetRange)
    .failOffsetX(failOffsetOpposite)
    .onStart((e) => {
      runOnJS(cancelTimeoutAndStop)();
      beginOffset.value = panTranslationX.value;
      nextBeginOffset.value = nextImageTranslationX.value;
      prevBeginOffset.value = prevImageTranslationX.value;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      const realTrnaslationX = e.translationX + beginOffset.value;

      const nextRealTranslationX = e.translationX + nextBeginOffset.value;
      const prevRealTranslationX = e.translationX + prevBeginOffset.value;

      if (DISABLED_PREVIOUS && e.translationX > 0) {
        return;
      } else if (DISABLED_NEXT && e.translationX < 0) {
        return;
      } else if (e.translationX > 0) {
      } else if (e.translationX < 0) {
      }
      nextImageTranslationX.value = nextRealTranslationX;
      prevImageTranslationX.value = prevRealTranslationX;
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
        nextImageTranslationX.value = withTiming(-measured.width, {
          duration: IMAGE_TRANSITION_DURATION,
        });
        prevImageTranslationX.value = withTiming(-measured.width, {
          duration: IMAGE_TRANSITION_DURATION,
        });

        runOnJS(onNextTimeout)();
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
        prevImageTranslationX.value = withTiming(measured.width, {
          duration: IMAGE_TRANSITION_DURATION,
        });
        nextImageTranslationX.value = withTiming(measured.width, {
          duration: IMAGE_TRANSITION_DURATION,
        });

        runOnJS(onPreviousTimeout)();
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

        nextImageTranslationX.value = withTiming(0, {
          duration: IMAGE_TRANSITION_DURATION,
        });
        prevImageTranslationX.value = withTiming(0, {
          duration: IMAGE_TRANSITION_DURATION,
        });
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
      runOnJS(sheetForceClose)({ duration: 200 });
    })
    .onBegin((event) => {})
    .onChange((event) => {
      pinchScale.value = event.scale;
    })
    .onEnd(() => {
      backgroundOpacity.value = withTiming(BACKDROP_OPACITY, { duration: 200 });

      runOnJS(sheetSnapToIndex)(0, { duration: 150 });
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

    if (isTransitioning.value) return;

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

  const nextImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: nextImageTranslationX.value }],
    };
  });

  const prevImageStyle = useAnimatedStyle(() => {
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
          ref={imageAnimatedRef as any}
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
            uri: initialNextImage,
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
}

export const ImageBackground = ({ children }: ImageBackgroundProps) => {
  const opacity = useImageViewerStore((state) => state.backgroundOpacity);

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
}

export const BlockInfoSheet = ({ children, block }: BlockInfoProps) => {
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

  const sheetAnimatedPosition = useImageViewerStore(
    (t) => t.sheetAnimatedPosition
  );
  const sheetRef = useImageViewerStore((t) => t.sheetRef);
  const animateOnMount = useImageViewerStore((t) => t.mounted);

  const initialSnapPoints = useMemo(() => ["20%", "50%"], []);
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
      animatedIndex={sheetAnimatedPosition}
      index={0}
      animateOnMount={true}
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
};

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
  const blockStore = useImageViewerStore<BlockStore>();

  //const {block, next(), previous()} = useCollectionState(id: string, inititalBlock: BasicImageBlock)
  const { next, previous, current, prefetchBlock } = useExploreState(
    blockStore.currentBlock.toString()
  );

  const { data: block, isLoading } = useBlock(
    blockStore.currentBlock.toString()
  );

  useEffect(() => {
    const p = async () => {
      await Promise.all([prefetchBlock(next?.id), prefetchBlock(previous?.id)]);
    };
    p();
  }, [blockStore.currentBlock]);

  const route = useNavigation();

  return (
    <Div className={`flex-1`}>
      <ImageBackground />

      <ImageViewer
        initialImage={current?.src_3x}
        image={block?.image_url}
        initialPreviousImage={previous?.src_3x}
        previousImage={previous?.src}
        initialNextImage={next?.src_3x}
        nextImage={next?.src}
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
          console.log("onPrevious");
          blockStore.setCurrentBlock(previous?.id);
        }}
      />
      <BlockInfoSheet block={block} />
    </Div>
  );
};

export const Home: FC<NativeStackScreenProps<Routes, "Home">> = ({
  navigation,
  route,
}) => {
  const mountAnimation = useImageViewerStore((t) => t.mountAnimation);
  const exitAnimation = useImageViewerStore((t) => t.exitAnimation);

  useLayoutEffect(() => {
    mountAnimation();
    let t;
    navigation.addListener("beforeRemove", (e) => {
      // source will only exist when onBack is called
      if (Object.keys(e.data.action).indexOf("source") !== -1) {
        return;
      } else {
        e.preventDefault();
        exitAnimation();
        t = setTimeout(() => {
          navigation.dispatch(e.data.action);
        }, 300);
      }
    });

    return () => {
      clearTimeout(t);
      navigation.removeListener("beforeRemove", () => {});
    };
  }, []);

  return (
    <ImageBlockViewer
      blockId={route.params.blockId}
      initialImageUrl={route.params.initialImageUrl}
    />
  );
};
