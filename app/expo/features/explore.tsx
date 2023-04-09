import { FlashList } from "@shopify/flash-list";
import { styled } from "nativewind";
import { FC, useEffect, useRef } from "react";
import { Image, Pressable, Text, View } from "react-native";

export const Div = styled(View);
export const T = styled(Text);
export const Img = styled(Image);

import { useInfiniteQuery } from "react-query";

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

const fetcher = async (pageNumber: number = 0) => {
  console.log("fetching page", pageNumber);

  try {
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
      body: `{"operationName":"ExploreContents","variables":{"page":${pageNumber},"per":20,"type":"CONNECTABLE","sort":"UPDATED_AT","seed":34234,"block_filter":"IMAGE","timestamp":"2023-04-11T11:51:16.721Z"},"query":"query ExploreContents($type: SearchType, $page: Int, $per: Int, $sort: SearchSorts, $seed: Int, $block_filter: BlockFilterEnum, $timestamp: DateTime) {\\n  contents: exxplore(\\n    type: $type\\n    page: $page\\n    per: $per\\n    sort_by: $sort\\n    seed: $seed\\n    block_filter: $block_filter\\n    timestamp: $timestamp\\n  ) {\\n    ...KonnectableCell\\n    __typename\\n  }\\n}\\n\\nfragment KonnectableCell on Konnectable {\\n  __typename\\n  ... on Model {\\n    id\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    href\\n    __typename\\n  }\\n  ... on Block {\\n    counts {\\n      comments\\n      __typename\\n    }\\n    __typename\\n  }\\n  ...KonnectableDisplay\\n  ...KonnectableMetadata\\n  ...KonnectableBlockOverlay\\n  ...LoadingBreadcrumbChannel\\n}\\n\\nfragment KonnectableDisplay on Konnectable {\\n  __typename\\n  ... on Model {\\n    id\\n    __typename\\n  }\\n  ...KonnectableChannel\\n  ...KonnectableText\\n  ...KonnectableImage\\n  ...KonnectableLink\\n  ...KonnectableEmbed\\n  ...KonnectableAttachment\\n  ...KonnectableMetadata\\n}\\n\\nfragment KonnectableChannel on Channel {\\n  id\\n  href\\n  truncatedTitle: title(truncate: 80)\\n  visibility\\n  updated_at(relative: true)\\n  counts {\\n    __typename\\n    contents\\n  }\\n  owner {\\n    __typename\\n    ... on Group {\\n      id\\n      name\\n      visibility\\n      __typename\\n    }\\n    ... on User {\\n      id\\n      name\\n      __typename\\n    }\\n  }\\n  ...KonnectableChannelOverlay\\n  ...LoadingBreadcrumbChannel\\n  __typename\\n}\\n\\nfragment KonnectableChannelOverlay on Channel {\\n  id\\n  visibility\\n  counts {\\n    __typename\\n    contents\\n  }\\n  __typename\\n}\\n\\nfragment LoadingBreadcrumbChannel on Channel {\\n  __typename\\n  id\\n  label: title\\n  owner {\\n    ... on User {\\n      __typename\\n      id\\n      name\\n    }\\n    ... on Group {\\n      __typename\\n      id\\n      name\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment KonnectableText on Text {\\n  id\\n  title\\n  href\\n  content(format: HTML)\\n  raw: content(format: MARKDOWN)\\n  __typename\\n}\\n\\nfragment KonnectableImage on Image {\\n  id\\n  title\\n  href\\n  alt_text\\n  src: image_url(size: DISPLAY)\\n  src_1x: resized_image_url(\\n    width: 315\\n    height: 315\\n    quality: 85\\n    fallback_format: PNG\\n  )\\n  src_2x: resized_image_url(width: 630, height: 630, fallback_format: PNG)\\n  src_3x: resized_image_url(width: 500, height: 500, fallback_format: PNG)\\n  original_dimensions {\\n    width\\n    height\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment KonnectableLink on Link {\\n  href\\n  title\\n  src: image_url(size: DISPLAY)\\n  src_1x: resized_image_url(\\n    width: 415\\n    height: 415\\n    quality: 90\\n    fallback_format: PNG\\n  )\\n  src_2x: resized_image_url(width: 630, height: 630, fallback_format: PNG)\\n  src_3x: resized_image_url(width: 945, height: 945, fallback_format: PNG)\\n  external_url: source_url\\n  content(format: HTML)\\n  __typename\\n}\\n\\nfragment KonnectableEmbed on Embed {\\n  id\\n  title\\n  href\\n  src: image_url(size: DISPLAY)\\n  src_1x: resized_image_url(width: 315, height: 315, quality: 85)\\n  src_2x: resized_image_url(width: 630, height: 630)\\n  src_3x: resized_image_url(width: 945, height: 945)\\n  __typename\\n}\\n\\nfragment KonnectableAttachment on Attachment {\\n  id\\n  title\\n  href\\n  src: image_url(size: DISPLAY)\\n  src_1x: resized_image_url(\\n    width: 415\\n    height: 415\\n    quality: 90\\n    fallback_format: PNG\\n  )\\n  src_2x: resized_image_url(width: 630, height: 630, fallback_format: PNG)\\n  src_3x: resized_image_url(width: 945, height: 945, fallback_format: PNG)\\n  file_extension\\n  __typename\\n}\\n\\nfragment KonnectableMetadata on Konnectable {\\n  ... on Model {\\n    updated_at(relative: true)\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    title\\n    user {\\n      id\\n      name\\n      __typename\\n    }\\n    connection {\\n      created_at(relative: true)\\n      user {\\n        id\\n        name\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on Attachment {\\n      file_extension\\n      __typename\\n    }\\n    ... on Link {\\n      source_url\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment KonnectableBlockOverlay on Konnectable {\\n  __typename\\n  ... on Model {\\n    id\\n    __typename\\n  }\\n  ... on ConnectableInterface {\\n    source {\\n      url\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"}`,
      method: "POST",
      mode: "cors",
      credentials: "omit",
    });
    const data = await response.json();

    return { data: data.data.contents, nextPage: pageNumber + 1 };
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    else throw new Error("Something went wrong.");
  }
};

export function useImages() {
  const {
    data,
    isError,
    isLoading,
    error,
    isFetching,
    hasNextPage,

    fetchNextPage,
  } = useInfiniteQuery(
    ["dogs"],
    (page) => {
      console.log("fetching page", page);
      return fetcher(page.pageParam);
    },
    {
      getNextPageParam: ({ nextPage }) => nextPage,
      staleTime: Infinity,
    }
  );

  return {
    data,
    isError,
    isLoading,
    error,
    isFetching,
    hasNextPage,
    fetchNextPage,
  };
}

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Easing,
  SharedTransition,
  WithTimingConfig,
  withTiming,
} from "react-native-reanimated";
import { Routes } from "../App";

export const Explore: FC<NativeStackScreenProps<Routes, "Explore">> = ({
  navigation,
  route,
}) => {
  const { isError, data, error, fetchNextPage, hasNextPage, isFetching } =
    useImages();

  const img = data?.pages?.flatMap((page) => {
    return page.data;
  });

  useEffect(() => {
    const alreadyExistMap = new Map<string, boolean>();

    img &&
      img.forEach((item) => {
        if (alreadyExistMap.has(item.id)) {
          console.log("already exist", item.id);
        } else {
          alreadyExistMap.set(item.id, true);
        }
      });
  }, [img]);

  const loadMore = hasNextPage ? fetchNextPage : undefined;

  const flashListRef = useRef<FlashList<any>>(null);

  return (
    <Div className="" style={{ flex: 1, backgroundColor: "black" }}>
      <FlashList
        data={img}
        contentContainerStyle={{ paddingTop: 30 }}
        ref={flashListRef}
        numColumns={2}
        renderItem={({ item, index, target }) => (
          <Pressable
            style={{ aspectRatio: 1, flex: 1 }}
            onPress={() => {
              navigation.push("Home", {
                blockId: item.id,
                initialImageUrl: item.src_3x,
              });
              // Linking.openURL(`https://are.na${item.href}`);
            }}
          >
            <Image
              resizeMode={"contain"}
              style={{ aspectRatio: 1, flex: 1, margin: 10 }}
              source={{
                uri: item.src_3x,
              }}
            />
          </Pressable>
        )}
        estimatedItemSize={130}
        onEndReached={() => {
          console.log("end reached");
          loadMore?.();
        }}
        onEndReachedThreshold={2}
        ListFooterComponent={isFetching ? <T>Loading...</T> : undefined}
      />
    </Div>
  );
};
