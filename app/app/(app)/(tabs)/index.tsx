import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ScreenLayout, StatusBarPadding } from "components";
import { KonnectableCell, KonnectableCell_Fragment } from "components/Blocks";
import {
  Header,
  HeaderSection,
  HeaderSectionContent,
  HeaderSectionItem,
  HeaderSectionTitle,
} from "components/Header";
import { useSession } from "context/auth";
import { request } from "graphql-request";
import { useRandomSeed } from "hooks/useRandomSeed";
import { apiUrl } from "lib/const";
import { getFragmentData } from "lib/gql";
import { graphql } from "lib/gql/gql";
import {
  BlockFilterEnum,
  ExploreContentsQuery,
  ExploreContentsQueryVariables,
  SearchSorts,
  SearchType,
} from "lib/gql/graphql";
import { useRef, useState } from "react";

const realQuery = graphql(/* GraphQL */ `
  query ExploreContents(
    $type: SearchType
    $page: Int
    $per: Int
    $sort: SearchSorts
    $seed: Int
    $block_filter: BlockFilterEnum
  ) {
    contents: exxplore(
      type: $type
      page: $page
      per: $per
      sort_by: $sort
      seed: $seed
      block_filter: $block_filter
    ) {
      ...KonnectableCell
      __typename
    }
  }
`);

const KonnectableChannelOverlay_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableChannelOverlay on Channel {
    id
    visibility
    counts {
      __typename
      contents
    }
    __typename
  }
`);

const LoadingBreadcrumbChannel_Fragment = graphql(/* GraphQL */ `
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

const KonnectableBlockOverlay_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableBlockOverlay on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ... on ConnectableInterface {
      source {
        url
        __typename
      }
      __typename
    }
  }
`);

export function useExplore(args: ExploreContentsQueryVariables) {
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
  } = useInfiniteQuery<ExploreContentsQuery>(
    ["explore", args.page, args.block_filter, args.type, args.sort, args.seed],
    async ({ meta, pageParam }) => {
      const resp = await request(
        apiUrl,
        realQuery,
        {
          ...args,
          page: pageParam ?? 1,
        },
        authHeaders
      );

      return resp;
    },
    {
      getNextPageParam: ({ contents }, pages) => {
        return pages.length ?? 1;
      },
      staleTime: 1000 * 60,
    }
  );

  return {
    data,
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
}

// exclure user
const exploreType = Object.values(SearchType).filter(
  (t) => t !== SearchType.User
);

const exploreSortType = {
  [SearchSorts.UpdatedAt]: "Recently Updated",
  [SearchSorts.Random]: "Random",
} as const;

type ExploreSortTypeKey = keyof typeof exploreSortType;

export default function TabOneScreen() {
  const flashListRef = useRef<any>(null);

  // TODO: move this to a hook/zustand
  const [filter, setFilter] = useState<BlockFilterEnum>(BlockFilterEnum.All);
  const [type, setType] = useState<SearchType>(SearchType.All);
  const [sort, setSort] = useState<ExploreSortTypeKey>(SearchSorts.UpdatedAt);
  // only show filter when type is Connectable
  const showFilter = type === SearchType.Connectable;
  const shouldSeed = sort === SearchSorts.Random;

  const [randomSeed, randomizeSeed] = useRandomSeed();

  const blocks = useExplore({
    per: 20,
    sort: sort,
    seed: shouldSeed ? randomSeed : undefined,
    type: type,
    block_filter: filter,
  });

  const { signOut } = useSession();

  return (
    <ScreenLayout>
      <FlashList
        refreshing={blocks.isRefetching}
        onRefresh={() => {
          blocks.refetch();
        }}
        ListHeaderComponent={
          <>
            <StatusBarPadding />
            <Header homePage>
              <HeaderSection>
                <HeaderSectionTitle>View</HeaderSectionTitle>
                <HeaderSectionContent>
                  {exploreType.map((t) => (
                    <HeaderSectionItem
                      selected={type === t}
                      onPress={() => {
                        setType(t);
                      }}
                      key={t}
                    >
                      {t}
                    </HeaderSectionItem>
                  ))}
                </HeaderSectionContent>
              </HeaderSection>
              {showFilter && (
                <HeaderSection>
                  <HeaderSectionTitle>Filter</HeaderSectionTitle>
                  <HeaderSectionContent>
                    {Object.values(BlockFilterEnum).map((f) => (
                      <HeaderSectionItem
                        selected={filter === f}
                        onPress={() => {
                          setFilter(f);
                        }}
                        key={f}
                      >
                        {f}
                      </HeaderSectionItem>
                    ))}
                  </HeaderSectionContent>
                </HeaderSection>
              )}
              <HeaderSection>
                <HeaderSectionTitle>Sort</HeaderSectionTitle>
                <HeaderSectionContent>
                  {Object.entries(exploreSortType).map(([key, value]) => (
                    <HeaderSectionItem
                      selected={sort === key}
                      onPress={() => {
                        setSort(key as ExploreSortTypeKey);
                        if (key === SearchSorts.Random) {
                          randomizeSeed();
                        }
                      }}
                      key={value}
                    >
                      {value}
                    </HeaderSectionItem>
                  ))}
                </HeaderSectionContent>
              </HeaderSection>
            </Header>
          </>
        }
        data={blocks.data?.pages.flatMap((page) => page.contents) ?? []}
        ref={flashListRef}
        numColumns={2}
        renderItem={({ item }) => {
          const cell = getFragmentData(KonnectableCell_Fragment, item);
          return <KonnectableCell cell={cell} />;
        }}
        estimatedItemSize={200}
        getItemType={(item) => {
          return item?.__typename;
        }}
        onEndReachedThreshold={0.8}
        onEndReached={async () => {
          blocks.fetchNextPage();
        }}
        // ListFooterComponent={isFetching ? <T>Loading...</T> : undefined}
      />
    </ScreenLayout>
  );
}
