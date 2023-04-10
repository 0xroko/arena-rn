import BottomSheet from "@gorhom/bottom-sheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
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
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Matrix3, clamp, identity3, multiply3 } from "react-native-redash";
import { useQuery } from "react-query";
import { Routes } from "../App";
import { AnimatedDiv, Div, Img, T } from "./shared";

export interface Block {
  __typename: string;
  id: number;
  title: string;
  href: string;
  source_url: string;
  image_url: string;
  image_updated_at: string;
  image_updated_at_unix_time: string;
  content: any;
  source: Source;
  created_at_unix_time: string;
  created_at_timestamp: string;
  created_at: string;
  updated_at: string;
  updated_at_timestamp: string;
  description: string;
  user: User;
  can: Can;
  shareable_href: string;
  shareable_title: string;
  editable_title: string;
  editable_description: string;
}

export interface Source {
  title: string;
  url: string;
  provider_name: string;
  provider_url: string;
  __typename: string;
}

export interface User {
  __typename: string;
  id: number;
  name: string;
  href: string;
}

export interface Can {
  manage: boolean;
  comment: boolean;
  __typename: string;
  mute: boolean;
  potentially_edit_thumbnail: boolean;
  edit_thumbnail: boolean;
}

const useBlock = (blockId: string) => {
  return useQuery(["block", blockId], async () => {
    const response = await fetch("https://api.are.na/graphql", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,hr-HR;q=0.8,hr;q=0.7,bs;q=0.6",
        "content-type": "application/json",
        "sec-ch-ua":
          '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-app-token": "pL4YhrdwXq7Bm7t8s6Yt",
        "x-auth-token": "PcZGfG8s-yggoJVSEpa4NBGCvFwMLxmo-5je-Y93",
      },
      referrer: "https://www.are.na/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `{\"operationName\":\"ModalFullBlock\",\"variables\":{\"id\":\"${blockId}\"},\"query\":\"query ModalFullBlock($id: ID!) {\\n  block: blokk(id: $id) {\\n    __typename\\n    ... on Model {\\n      id\\n      __typename\\n    }\\n    ...FullBlock\\n  }\\n}\\n\\nfragment FullBlock on Konnectable {\\n  __typename\\n  ... on Model {\\n    id\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    title\\n    href\\n    __typename\\n  }\\n  ...FullBlockContentPane\\n  ...FullBlockMetadataPane\\n}\\n\\nfragment FullBlockContentPane on Konnectable {\\n  ...FullBlockImage\\n  ...FullBlockText\\n  ...FullBlockLink\\n  ...FullBlockAttachment\\n  ...FullBlockEmbed\\n  __typename\\n}\\n\\nfragment FullBlockImage on Konnectable {\\n  ... on Image {\\n    id\\n    title\\n    thumb_url: image_url(size: THUMB)\\n    image_url(size: LARGE)\\n    original_image_url: image_url(size: ORIGINAL)\\n    alt_text\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment FullBlockText on Text {\\n  __typename\\n  id\\n  content(format: HTML)\\n  raw: content(format: MARKDOWN)\\n  can {\\n    manage\\n    __typename\\n  }\\n}\\n\\nfragment FullBlockLink on Konnectable {\\n  __typename\\n  ... on Link {\\n    id\\n    title\\n    source_url\\n    image_url(size: ORIGINAL)\\n    image_updated_at(format: \\\"%m/%d/%y\\\")\\n    image_updated_at_unix_time: image_updated_at(format: \\\"%s\\\")\\n    content(format: HTML)\\n    source {\\n      title\\n      url\\n      provider_name\\n      provider_url\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment FullBlockAttachment on Konnectable {\\n  __typename\\n  ... on Attachment {\\n    id\\n    title\\n    file_extension\\n    file_url\\n    file_size\\n    file_content_type\\n    image_url(size: DISPLAY)\\n    image_updated_at(format: \\\"%m/%d/%y\\\")\\n    image_updated_at_unix_time: image_updated_at(format: \\\"%s\\\")\\n    __typename\\n  }\\n}\\n\\nfragment FullBlockEmbed on Konnectable {\\n  ... on Embed {\\n    id\\n    title\\n    embed_html\\n    embed_width\\n    embed_height\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment FullBlockMetadataPane on Konnectable {\\n  ... on Model {\\n    created_at_unix_time: created_at(format: \\\"%s\\\")\\n    created_at_timestamp: created_at\\n    created_at(relative: true)\\n    updated_at(relative: true)\\n    updated_at_timestamp: updated_at\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    title\\n    description(format: HTML)\\n    user {\\n      __typename\\n      id\\n      name\\n      href\\n    }\\n    __typename\\n  }\\n  ... on Block {\\n    can {\\n      manage\\n      comment\\n      __typename\\n    }\\n    __typename\\n  }\\n  ...FullBlockActions\\n  ...ManageBlock\\n  __typename\\n}\\n\\nfragment FullBlockActions on Konnectable {\\n  __typename\\n  ... on Image {\\n    find_original_url\\n    downloadable_image: resized_image_url(downloadable: true)\\n    __typename\\n  }\\n  ... on Text {\\n    find_original_url\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    source {\\n      title\\n      url\\n      __typename\\n    }\\n    __typename\\n  }\\n  ... on Block {\\n    can {\\n      mute\\n      potentially_edit_thumbnail\\n      edit_thumbnail\\n      __typename\\n    }\\n    __typename\\n  }\\n  ...FullBlockShare\\n}\\n\\nfragment FullBlockShare on Konnectable {\\n  ... on ConnectableInterface {\\n    shareable_href: href\\n    shareable_title: title(truncate: 40)\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ManageBlock on Konnectable {\\n  __typename\\n  ... on Model {\\n    id\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    editable_title: title\\n    editable_description: description(format: MARKDOWN)\\n    __typename\\n  }\\n  ... on Text {\\n    editable_content: content(format: MARKDOWN)\\n    __typename\\n  }\\n  ... on Image {\\n    editable_alt_text: alt_text\\n    __typename\\n  }\\n}\\n\"}`,
      method: "POST",
      mode: "cors",
      credentials: "omit",
    });
    const data = await response.json();
    return data.data.block as Block;
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

export const Home: FC<NativeStackScreenProps<Routes, "Home">> = ({
  navigation,
  route,
}) => {
  const { blockId, initialImageUrl } = route.params;

  const { data: block, isLoading } = useBlock(blockId);

  const sheetAnimatedIndex = useSharedValue(0);
  const sheetAnimatedPosition = useSharedValue(0);

  const initialSnapPoints = useMemo(() => ["25%", "50%"], []);

  const backgroundOpacity = useSharedValue(0);

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
  const opacity = useSharedValue(0);
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    backgroundOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const isLongPressing = useSharedValue(false);

  const forceCloseSheet = sheetRef?.current?.forceClose;

  const [showModal, setShowModal] = useState(false);

  const [higlighted, setHighlighted] = useState(-1);
  const position = useSharedValue(0);

  const timingDuration = useSharedValue(0);

  const flingGesture = Gesture.Fling()
    .direction(Directions.DOWN)
    .numberOfPointers(1)
    .onStart((e) => {})
    .onEnd((e) => {
      console.log("fling");
      backgroundOpacity.value = withTiming(0, { duration: 100 });
      position.value = withSequence(
        withTiming(position.value + 50, { duration: 100 }, (e) => {
          e && runOnJS(navigation.pop)();
          e && runOnJS(forceCloseSheet)({ duration: 100 });
        }),
        withTiming(0, { duration: 100 })
      );
      // runOnJS(setShowModal)(true);
    });

  const flingGestureNext = Gesture.Fling()
    .direction(Directions.RIGHT)
    .numberOfPointers(1)
    .onStart((e) => {})
    .onEnd((e) => {
      console.log("fling", e);
    });

  const filngStyle = useAnimatedStyle(() => {
    return {
      // testing inace Y
      transform: [{ translateY: position.value }],
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
      duration: isPinching.value ? 0 : 100,
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
    longPressGesture,
    Gesture.Simultaneous(pinch, pan),

    flingGesture
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

  const handleSnapPress = useCallback((index) => {
    sheetRef.current?.snapToIndex(index);
  }, []);
  const handleClosePress = useCallback(() => {
    sheetRef.current?.close();
  }, []); // render

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
      console.log("beforeRemove");

      e.preventDefault();

      backgroundOpacity.value = withTiming(0, { duration: 100 });
      position.value = withSequence(
        withTiming(position.value + 50, { duration: 100 }, (e) => {}),
        withTiming(0, { duration: 100 })
      );
      opacity.value = withTiming(0, { duration: 200 }, () => {});
      t = setTimeout(() => {
        navigation.dispatch(e.data.action);
      }, 200);
    });

    return () => {
      clearTimeout(t);
      navigation.removeListener("beforeRemove", () => {});
    };
  }, []);

  return (
    <AnimatedDiv
      style={backgroundStyle}
      collapsable={false}
      className={`flex-1 bg-[#000000b7]`}
    >
      <Div className="flex relative flex-1 flex-col justify-start">
        <GestureDetector gesture={gesturesCobined}>
          <Animated.View
            ref={ref as any}
            collapsable={false}
            style={[
              {
                height: "80%",
                width: "100%",
                // backgroundColor: "red",
              },
              animatedStyle,
              filngStyle,
            ]}
          >
            <Img
              placeholderContentFit="contain"
              style={{ flex: 1, marginHorizontal: 6, zIndex: 77 }}
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
            ></Img>
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
    </AnimatedDiv>
  );
};
