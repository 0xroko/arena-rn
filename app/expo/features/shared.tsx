import { Image } from "expo-image";
import { styled } from "nativewind";
import { useMemo } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  SharedTransition,
  WithTimingConfig,
  withTiming,
} from "react-native-reanimated";
import { InfiniteData, QueryClient } from "react-query";

export const Div = styled(View);
export const T = styled(Text);
export const Img = styled(Image);

export const AnimatedDiv = Animated.createAnimatedComponent(Div);

export const AnimatedImage = Animated.createAnimatedComponent(Image);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { cacheTime: 999999, staleTime: Infinity },
  },
});

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

import { create } from "zustand";
import { Content } from "./explore";
export const blockFetcher = async (blockId: string) => {
  const response = await fetch("  ", {
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
};

interface BlockStore {
  currentBlock: number;
  initialBlock: number;
  mounted: boolean;
  setCurrentBlock: (block: any) => void;
  setMounted: (mounted: boolean) => void;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  currentBlock: -1,
  initialBlock: -1,
  mounted: false,
  setMounted: (mounted) => set({ mounted }),
  setCurrentBlock: (block) => {
    set({ currentBlock: block });
    if (get().initialBlock === -1) set({ initialBlock: block });
  },
}));

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

export const useExploreState = (blockId?: any) => {
  const d = useMemo(() => {
    const pages = queryClient
      .getQueryData<
        InfiniteData<{
          data: Content[];
          nextPage: number;
        }>
      >("blocks")
      ?.pages?.flatMap((page) => page?.data);

    if (!pages || !blockId) {
      return {
        currentIndex: 0,
        next: null,
        previous: null,
      };
    }

    let currentIndex = -1;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      if (page?.id?.toString() === blockId.toString()) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex === -1) {
      return {
        currentIndex: 0,
        next: null,
        previous: null,
      };
    }

    const next = pages[currentIndex + 1] as Content;

    return {
      currentIndex,
      current: pages[currentIndex] as Content,
      next,
      previous: pages[currentIndex - 1] as Content,
    };
  }, [blockId]);

  const prefetchBlock = async (blockId?: any) => {
    await queryClient.prefetchQuery(["block", blockId], () =>
      blockFetcher(blockId)
    );
  };

  return {
    ...d,
    prefetchBlock,
  };
};
