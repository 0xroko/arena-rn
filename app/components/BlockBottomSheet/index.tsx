import BottomSheet, { BottomSheetSectionList } from "@gorhom/bottom-sheet";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  CompactChannel,
  CompactChannel_Fragment,
} from "components/CompactChannel";
import { useImageViewerStore } from "components/ImageViewer";
import { useSession } from "context/auth";
import { Link } from "expo-router";
import request from "graphql-request";
import { apiUrl } from "lib/const";
import { getFragmentData, graphql } from "lib/gql";
import {
  CompactChannelFragment,
  FullBlockActionsFragment,
  FullBlockFoldQuery,
  FullBlockMetadataPaneFragment,
} from "lib/gql/graphql";
import { useMemo } from "react";
import {
  Linking,
  Pressable,
  Share,
  Text,
  TouchableNativeFeedbackProps,
  View,
} from "react-native";
import { TouchableNativeFeedback } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

const FullBlockConnections_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockConnections on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ... on Block {
      counts {
        public_channels
        current_user_channels: channels_by_current_user
        private_channels: private_accessible_channels
        __typename
      }
      __typename
    }
    ... on ConnectableInterface {
      current_user_channels: connections(filter: OWN) {
        __typename
        id
        created_at(format: "%B %Y")
        channel {
          ...CompactChannel
          __typename
        }
      }
      public_channels: connections(
        page: $page
        per: $per
        direction: DESC
        filter: EXCLUDE_OWN
      ) {
        __typename
        id
        created_at(format: "%B %Y")
        channel {
          ...CompactChannel
          __typename
        }
      }
      source {
        url
        __typename
      }
      ...FullBlockChannelsAlsoIn
      __typename
    }
  }
`);

const blockConnectionsQuery = graphql(/* GraphQL */ `
  query FullBlockConnectionsQuery($id: ID!, $page: Int, $per: Int) {
    block: blokk(id: $id) {
      ...FullBlockConnections
      __typename
    }
  }

  fragment LoadingBreadcrumbChannel on Channel {
    __typename
    id
    label: title
    owner {
      ... on User {
        __typename
        id
        name
      }
      ... on Group {
        __typename
        id
        name
      }
      __typename
    }
  }

  fragment FullBlockChannelsAlsoIn on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ... on Block {
      counts {
        channels_with_same_source
        __typename
      }
      channels_with_same_source(per: 5) {
        ...CompactChannel
        __typename
      }
      __typename
    }
  }
`);

const useBlockConnections = (id: string) => {
  const { authHeaders } = useSession();
  return useInfiniteQuery({
    queryKey: ["block", { id }, "connections"],
    queryFn: async ({ pageParam = 1 }) => {
      const req = await request(
        apiUrl,
        blockConnectionsQuery,
        {
          id,
          page: pageParam ?? 1,
          per: 24,
        },
        authHeaders
      );
      return req;
    },
    getNextPageParam: (lastPage, pages) => {
      return pages?.length + 1;
    },
  });
};

interface BlockBottomSheetMetaProps {
  children?: React.ReactNode | React.ReactNode[];
  meta?: FullBlockMetadataPaneFragment | null;
}

export const BlockBottomSheetMeta = ({
  children,
  meta,
}: BlockBottomSheetMetaProps) => {
  return (
    <View className={` pb-5`}>
      <View className={`text-ellipsis`}>
        <Text className={`text-accent-1 text-lg font-bold`}>
          {meta?.title || "-"}
        </Text>
        <Text className={`text-accent-2 text-sm mt-3`}>
          Added {meta?.created_at} by{" "}
          <Link href={`/user/${meta?.user?.href}`} asChild>
            <Text className={`font-bold text-accent-2`}>
              {meta?.user?.name}
            </Text>
          </Link>
        </Text>
        <Text className={`text-accent-2 text-sm`}>
          Last updated {meta?.updated_at}
        </Text>
        {meta?.source?.url && (
          <Pressable
            onPress={() => {
              if (!meta?.source?.url) return;
              Linking.openURL(meta?.source?.url);
            }}
          >
            <Text className={`text-accent-2 text-sm`}>
              Source: {meta?.source?.title}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

interface BlockBottomSheetActionProps extends TouchableNativeFeedbackProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockBottomSheetAction = ({
  children,
  ...props
}: BlockBottomSheetActionProps) => {
  return (
    <TouchableNativeFeedback {...props}>
      <Text className={`text-accent-1 font-bold py-0.5`}>{children}</Text>
    </TouchableNativeFeedback>
  );
};

const FullBlockShare_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockShare on Konnectable {
    ... on ConnectableInterface {
      shareable_href: href
      shareable_title: title(truncate: 40)
      __typename
    }
    __typename
  }
`);

interface BlockBottomSheetActionsProps {
  children?: React.ReactNode | React.ReactNode[];
  actions?: FullBlockActionsFragment | null;
}

export const BlockBottomSheetActions = ({
  children,
  actions,
}: BlockBottomSheetActionsProps) => {
  const share = getFragmentData(FullBlockShare_Fragment, actions);

  const actionList = [];

  if (actions?.__typename === "Image") {
    actionList.push(
      <BlockBottomSheetAction
        key={`download`}
        onPress={() => {
          // open image in a new tab
          Linking.openURL(actions?.downloadable_image!);
        }}
      >
        Download
      </BlockBottomSheetAction>
    );
    actionList.push(
      <BlockBottomSheetAction
        key={`find_org`}
        onPress={() => {
          // open image in a new tab
          Linking.openURL(actions?.find_original_url!);
        }}
      >
        Find original
      </BlockBottomSheetAction>
    );
  }

  return (
    <>
      <View
        className={`border-accent-2 flex-row justify-between my-2 border-b`}
      >
        <Text className={`text-accent-2 my-2`}>Actions</Text>
        {/* <Text className={`text-accent-2 my-2 font-bold`}>Flag</Text> */}
      </View>
      <View className={`flex g-1`}>
        <BlockBottomSheetAction
          onPress={() => {
            Share.share({
              url: "https://are.na" + share?.shareable_href!,
              message: "https://are.na" + share?.shareable_href!,
              title: share?.shareable_title!,
            });
          }}
        >
          Share
        </BlockBottomSheetAction>
        {actionList}
      </View>
    </>
  );
};

interface BlockBottomProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockBottomSheet = ({ children }: BlockBottomProps) => {
  const sheetAnimatedPosition = useImageViewerStore(
    (t) => t.sheetAnimatedPosition
  );
  const sheetRef = useImageViewerStore((t) => t.sheetRef);

  const initialSnapPoints = useMemo(() => ["20%", "50%"], []);
  return (
    <BottomSheet
      enableDynamicSizing
      enableOverDrag={false}
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
      {children}
    </BottomSheet>
  );
};

const fullBlockFold = graphql(/* GraphQL */ `
  query FullBlockFold($id: ID!) {
    block: blokk(id: $id) {
      ... on Block {
        counts {
          __typename
          public_channels
          private_channels: private_accessible_channels
          comments
        }
        can {
          manage
          comment
          __typename
        }
        __typename
      }
    }
  }
`);

const useFullBlockFold = (id: string) => {
  const { authHeaders } = useSession();
  return useQuery({
    queryFn: async () => {
      const req = await request(apiUrl, fullBlockFold, { id }, authHeaders);
      return req;
    },
    queryKey: ["block", { id }, "fold"],
  });
};

interface BlockBottomSheetFoldProps {
  children?: React.ReactNode | React.ReactNode[];
  id: string;
}

export const BlockBottomSheetFold = ({
  children,
  id,
}: BlockBottomSheetFoldProps) => {
  const { data, error } = useFullBlockFold(id);

  if (["Channel", undefined].includes(data?.block?.__typename)) return null;

  // ts not inferring type
  const block = data?.block as Extract<
    FullBlockFoldQuery["block"],
    { __typename: "Image" }
  >;

  const plural = block?.counts?.public_channels === 1 ? "" : "s";

  return (
    <View className={`border-accent-2 flex-row justify-between my-2 border-b`}>
      <Text className={`text-accent-2 my-2`}>
        {block?.counts?.public_channels} Connection{plural}
      </Text>
    </View>
  );
};

interface BlockBottomSheetConnectionTitleProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockBottomSheetConnectionTitle = ({
  children,
}: BlockBottomSheetConnectionTitleProps) => {
  return (
    <View className={`flex flex-1 flex-row justify-center items-center`}>
      <Text className={`text-sm text-accent-2 py-4 capitalize`}>
        {children}
      </Text>
    </View>
  );
};

interface BlockBottomSheetConnectionsProps {
  children?: React.ReactNode | React.ReactNode[];
  header?: React.ReactNode | React.ReactNode[];
  id: string;
}

export const BlockBottomSheetConnections = ({
  header,
  id,
}: BlockBottomSheetConnectionsProps) => {
  const { data, error, isRefetching, refetch, fetchNextPage } =
    useBlockConnections(id);

  const publicChannels = data?.pages?.flatMap((page) => {
    const t = getFragmentData(FullBlockConnections_Fragment, page.block);
    return t?.public_channels;
  });

  const userChannels = getFragmentData(
    FullBlockConnections_Fragment,
    data?.pages?.[0]?.block
  );

  const groupedChannels = useMemo(() => {
    const groupedChannelsMap = publicChannels?.reduce((acc, channel) => {
      if (!channel) return acc;
      if (!acc[channel.created_at]) {
        acc[channel.created_at] = [];
      }
      acc[channel.created_at].push(
        getFragmentData(CompactChannel_Fragment, channel.channel)
      );
      return acc;
    }, {} as Record<string, CompactChannelFragment[]>);

    if (!groupedChannelsMap) return [];

    // transform into array
    const groupedChannels = Object.entries(groupedChannelsMap ?? {}).map(
      ([key, value]) => ({
        title: key,
        data: value,
      })
    );
    return groupedChannels;
  }, [publicChannels]);

  const hasUserChannels =
    (userChannels?.current_user_channels?.length ?? 0) > 0;

  if (!publicChannels) return null;

  return (
    <BottomSheetSectionList<any>
      sections={groupedChannels}
      contentContainerStyle={{
        paddingHorizontal: 20,
      }}
      ListHeaderComponent={() => {
        return (
          <>
            {header}
            {hasUserChannels && (
              <>
                <BlockBottomSheetConnectionTitle>
                  Your connections
                </BlockBottomSheetConnectionTitle>
                {userChannels?.current_user_channels?.map((c) => {
                  const channel = getFragmentData(
                    CompactChannel_Fragment,
                    c.channel
                  );
                  return <CompactChannel channel={channel} />;
                })}
                <BlockBottomSheetConnectionTitle>
                  All Connections
                </BlockBottomSheetConnectionTitle>
              </>
            )}
          </>
        );
      }}
      onEndReached={() => {
        fetchNextPage();
      }}
      renderSectionHeader={({ section: { title } }) => {
        return (
          <View className={"pt-2 pb-1 bg-black"}>
            <Text className={`text-sm text-accent-2 font-normal`}>{title}</Text>
          </View>
        );
      }}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => {
        return <CompactChannel channel={item} />;
      }}
    />
  );
};
