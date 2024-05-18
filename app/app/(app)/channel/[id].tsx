import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ScreenLayout } from "components";
import { KonnectableCell, KonnectableCell_Fragment } from "components/Blocks";
import { Header } from "components/Header";
import { useSession } from "context/auth";
import { useLocalSearchParams } from "expo-router";
import request from "graphql-request";
import { apiUrl } from "lib/const";
import { getFragmentData, graphql } from "lib/gql";
import {
  ChannelBlokksPaginatedQueryVariables,
  ChannelContentsConnectableFragmentDoc,
  ChannelPageQueryVariables,
} from "lib/gql/graphql";

const channelInfo_ChannelMetadataFragment = graphql(/* GraphQL */ `
  fragment ChannelMetadata on Channel {
    ...ChannelBreadcrumb
    ...ChannelMetadataActions
    ...ChannelMetadataInfo
    ...CollaboratorsList
    ...ChannelMetadataConnections
    ...ChannelShareButton
    slug
    __typename
  }
`);

const channelInfo_ChannelBreadcrumbFragment = graphql(/* GraphQL */ `
  fragment ChannelBreadcrumb on Channel {
    __typename
    id
    title
    truncatedTitle: title(truncate: 35)
    href
    visibility
    owner {
      __typename
      ... on User {
        id
        name
        href
        ...LoadingBreadcrumbUser
        __typename
      }
      ... on Group {
        id
        name
        href
        ...LoadingBreadcrumbGroup
        __typename
      }
    }
    counts {
      collaborators
      __typename
    }
    ...LoadingBreadcrumbChannel
  }
`);

const channelInfo_ChannelMetadataActionsFragment = graphql(/* GraphQL */ `
  fragment ChannelMetadataActions on Channel {
    __typename
    id
    can {
      follow
      update
      destroy
      mute
      __typename
    }
    ...MuteChannelButton
  }
`);

const channelInfo_ChannelMetadataInfoFragment = graphql(/* GraphQL */ `
  fragment ChannelMetadataInfo on Channel {
    __typename
    id
    href
    visibility
    info: description(format: HTML)
    counts {
      followers
      __typename
    }
    can {
      share
      __typename
    }
    user {
      __typename
      id
      href
      name
    }
  }
`);

const channelInfo_ChannelMetadataConnectionsFragment = graphql(/* GraphQL */ `
  fragment ChannelMetadataConnections on Channel {
    __typename
    id
    can {
      connect
      __typename
    }
    connected_to_channels {
      __typename
      id
      label: title
      href
      ...LoadingBreadcrumbChannel
    }
  }
`);

const channelInfo_ChannelContentsFilterFragment = graphql(/* GraphQL */ `
  fragment ChannelContentsFilter on Channel {
    __typename
    id
    title
    counts {
      contents
      blocks
      channels
      __typename
    }
  }
`);

const channelInfo_ChannelEmptyMessageFragment = graphql(/* GraphQL */ `
  fragment ChannelEmptyMessage on Channel {
    __typename
    id
    counts {
      contents
      __typename
    }
    can {
      add_to
      add_to_as_premium
      __typename
    }
    owner {
      __typename
      ... on User {
        id
        name
        href
        __typename
      }
      ... on Group {
        id
        name
        href
        __typename
      }
    }
  }
`);

const channelInfo_CollaboratorsListFragment = graphql(/* GraphQL */ `
  fragment CollaboratorsList on Channel {
    __typename
    id
    can {
      manage_collaborators
      __typename
    }
    collaborators: members {
      ...CollaboratorLink
      __typename
    }
  }
`);

const channelInfo_CollaboratorLinkFragment = graphql(/* GraphQL */ `
  fragment CollaboratorLink on Member {
    __typename
    ... on User {
      id
      name
      href
      __typename
    }
    ... on Group {
      id
      name
      href
      description(format: MARKDOWN)
      user {
        id
        name
        href
        __typename
      }
      users {
        id
        name
        href
        __typename
      }
      can {
        manage
        manage_users
        __typename
      }
      visibility
      __typename
    }
    ...LoadingBreadcrumbGroup
    ...LoadingBreadcrumbUser
  }
`);

const channelInfo_MuteChannelButtonFragment = graphql(/* GraphQL */ `
  fragment MuteChannelButton on Channel {
    __typename
    id
    is_muted
  }
`);

const channelInfo_ChannelShareButtonFragment = graphql(/* GraphQL */ `
  fragment ChannelShareButton on Channel {
    __typename
    id
    visibility
    share {
      url
      twitter_url
      facebook_url
      __typename
    }
  }
`);

const channelInfo_ChannelPageMetaTagsFragment = graphql(/* GraphQL */ `
  fragment ChannelPageMetaTags on Channel {
    __typename
    id
    meta_title: title
    meta_description: description(format: MARKDOWN)
    canonical: href(absolute: true)
    is_nsfw
    image_url(size: DISPLAY)
    visibility
    owner {
      ... on User {
        is_indexable
        __typename
      }
      __typename
    }
  }
`);

const channelInfoQuery = graphql(/* GraphQL */ `
  query ChannelPage($id: ID!) {
    channel(id: $id) {
      ...ChannelMetadata
      ...ChannelPageMetaTags
      ...ChannelEmptyMessage
      ...ChannelContentsFilter
      __typename
    }
  }

  fragment LoadingBreadcrumbUser on User {
    __typename
    id
    label: name
  }

  fragment LoadingBreadcrumbGroup on Group {
    __typename
    id
    label: name
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

  fragment ChannelContentsFilter on Channel {
    __typename
    id
    title
    counts {
      contents
      blocks
      channels
      __typename
    }
  }
`);

const channelBlocksQuery = graphql(/* GraphQL */ `
  query ChannelBlokksPaginated($id: ID!, $page: Int!, $per: Int!) {
    channel(id: $id) {
      __typename
      id
      title

      blokks(page: $page, per: $per, sort_by: POSITION, direction: DESC) {
        __typename
        ...ChannelContentsConnectable
      }
      counts {
        contents
        blocks
        channels
        __typename
      }
    }
  }

  fragment ChannelContentsConnectable on Konnectable {
    ...KonnectableCell
    __typename
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
`);

export const useChannelBlocks = (
  args: Pick<ChannelBlokksPaginatedQueryVariables, "id">
) => {
  const { authHeaders } = useSession();

  const {
    data,
    isError,
    isLoading,
    error,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery(
    ["channel", "blocks", args.id],
    async ({ meta, pageParam }) => {
      const resp = await request(
        apiUrl,
        channelBlocksQuery,
        {
          ...args,
          page: pageParam ?? 1,
          per: 20,
        },
        authHeaders
      );

      return resp;
    },
    {
      getNextPageParam: ({ channel }, pages) => {
        return pages?.length;
      },
      staleTime: 1000 * 60 * 1000,
    }
  );

  return {
    data: data,
    isError,
    isLoading,
    isRefetching,
    refetch,
    error,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
  };
};

const useChannelInfo = (args: Pick<ChannelPageQueryVariables, "id">) => {
  const { authHeaders } = useSession();

  const { data, isError, isLoading, error } = useQuery(
    ["channel", args],
    async ({}) => {
      const resp = await request(
        apiUrl,
        channelInfoQuery,
        {
          id: args.id,
        },
        authHeaders
      );

      return resp;
    },
    {}
  );

  return {
    data,
    isError,
    isLoading,
    error,
  };
};

export default function ChannelScreen() {
  const a = useLocalSearchParams<{
    channel: string;
    user: string;
    id: string;
  }>();

  const { data, error, isRefetching, refetch, fetchNextPage } =
    useChannelBlocks({
      id: a.id!,
    });

  const { data: channelInfoData } = useChannelInfo({
    id: a.id!,
  });

  const d = getFragmentData(
    channelInfo_ChannelMetadataFragment,
    channelInfoData?.channel
  );
  const d1 = getFragmentData(channelInfo_ChannelBreadcrumbFragment, d);

  return (
    <ScreenLayout style={{ backgroundColor: "black" }}>
      <FlashList
        refreshing={isRefetching}
        onRefresh={() => {
          refetch();
          //
        }}
        ListHeaderComponent={
          <>
            <ScreenLayout.StatusBarPadding />
            <Header
              channelName={d1?.title}
              channelVisibility={d1?.visibility}
              userName={d1?.owner.name}
            ></Header>
          </>
        }
        data={data?.pages?.flatMap((page) => page.channel?.blokks) ?? []}
        onScroll={(e) => {}}
        numColumns={2}
        // add some padding to all elements

        // keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const cell = getFragmentData(
            ChannelContentsConnectableFragmentDoc,
            item
          );
          const t = getFragmentData(KonnectableCell_Fragment, cell);
          return <KonnectableCell cell={t} />;
        }}
        estimatedItemSize={200}
        getItemType={(item) => {
          return item?.__typename;
        }}
        onEndReachedThreshold={0.8}
        onEndReached={async () => {
          fetchNextPage();
        }}
        // ListFooterComponent={isFetching ? <T>Loading...</T> : undefined}
      />
    </ScreenLayout>
  );
}
