import { styled } from "nativewind";
import React from "react";
import { View, Text, Image } from "react-native";

export const Div = styled(View);
export const T = styled(Text);
export const Img = styled(Image);

import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "react-query";

const fetcher = async (pageNumber: number = 0) => {
  try {
    const response = await fetch(
      `https://picsum.photos/v2/list?limit=20&page=${pageNumber}`
    );
    const data = await response.json();
    return { data, nextPage: pageNumber + 1 };
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
  } = useInfiniteQuery(["dogs"], () => fetcher(), {
    getNextPageParam: ({ nextPage }) => nextPage,
    staleTime: Infinity,
  });

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

const DATA = [
  {
    title: "First Item",
  },
  {
    title: "Second Item",
  },
];

const MyList = () => {
  return (
    <FlashList
      data={DATA}
      renderItem={({ item }) => <T>{item.title}</T>}
      estimatedItemSize={200}
    />
  );
};
export const Home = () => {
  const { isError, data, error, fetchNextPage, hasNextPage, isFetching } =
    useImages();

  const img = data?.pages.flatMap((page) => page.data);

  const loadMore = hasNextPage ? fetchNextPage : undefined;

  return (
    <Div className="mt-[30px] flex-1 flex flex-row">
      <FlashList
        data={img}
        numColumns={3}
        renderItem={({ item }) => {
          // console.log(item);
          return (
            <Img
              style={{ aspectRatio: 1, flex: 1 }}
              source={{ uri: item.download_url }}
            />
          );
        }}
        estimatedItemSize={130}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetching ? <T>Loading...</T> : undefined}
      />
    </Div>
  );
};
