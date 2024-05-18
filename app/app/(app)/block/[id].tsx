import { useQuery } from "@tanstack/react-query";
import { ScreenLayout } from "components";
import {
  BlockBottomSheet,
  BlockBottomSheetActions,
  BlockBottomSheetConnections,
  BlockBottomSheetFold,
  BlockBottomSheetMeta,
} from "components/BlockBottomSheet";
import { ImageBackground, ImageViewer } from "components/ImageViewer";
import { useSession } from "context/auth";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import request from "graphql-request";
import { apiUrl } from "lib/const";
import { getFragmentData, graphql } from "lib/gql";
import { tw } from "lib/tw";
import React from "react";
import { Dimensions, Linking, Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import WebView from "react-native-webview";

const BlockBottomQuery = graphql(/* GraphQL */ `
  query ModalFullBlock($id: ID!) {
    block: blokk(id: $id) {
      __typename
      ... on Model {
        id
        __typename
      }
      ...FullBlock
    }
  }
`);

const FullBlock_Fragment = graphql(/* GraphQL */ `
  fragment FullBlock on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ... on ConnectableInterface {
      title
      href
      __typename
    }
    ...FullBlockContentPane
    ...FullBlockMetadataPane
  }
`);

const FullBlockContentPane_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockContentPane on Konnectable {
    ...FullBlockImage
    ...FullBlockText
    ...FullBlockLink
    ...FullBlockAttachment
    ...FullBlockEmbed
    __typename
  }
`);

const FullBlockImage_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockImage on Image {
    id
    title
    thumb_url: image_url(size: THUMB)
    image_url(size: LARGE)
    src_1x: resized_image_url(
      width: 315
      height: 315
      quality: 85
      fallback_format: PNG
    )
    original_image_url: image_url(size: ORIGINAL)
    alt_text
    __typename
  }
`);

const FullBlockLink_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockLink on Link {
    id
    title
    source_url
    image_url(size: ORIGINAL)
    image_updated_at(format: "%m/%d/%y")
    image_updated_at_unix_time: image_updated_at(format: "%s")
    content(format: HTML)
    source {
      title
      url
      provider_name
      provider_url
      __typename
    }
    __typename
  }
`);

const FullBlockAttachment_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockAttachment on Attachment {
    id
    title
    file_extension
    file_url
    file_size
    file_content_type
    image_url(size: DISPLAY)
    image_updated_at(format: "%m/%d/%y")
    image_updated_at_unix_time: image_updated_at(format: "%s")
    __typename
  }
`);

const FullBlockText_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockText on Text {
    __typename
    id
    html_content: content(format: HTML)
    raw: content(format: MARKDOWN)
    can {
      manage
      __typename
    }
  }
`);

const FullBlockEmbed_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockEmbed on Embed {
    id
    title
    embed_html
    embed_width
    embed_height
    __typename
  }
`);

const FullBlockActions_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockActions on Konnectable {
    __typename
    ... on Image {
      find_original_url
      downloadable_image: resized_image_url(downloadable: true)
      __typename
    }
    ... on Text {
      find_original_url
      __typename
    }
    ... on ConnectableInterface {
      source {
        title
        url
        __typename
      }
      __typename
    }
    ... on Block {
      can {
        mute
        potentially_edit_thumbnail
        edit_thumbnail
        __typename
      }
      __typename
    }
    ...FullBlockShare
  }
`);

const ManageBlock_Fragment = graphql(/* GraphQL */ `
  fragment ManageBlock on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ... on ConnectableInterface {
      editable_title: title
      editable_description: description(format: MARKDOWN)
      __typename
    }
    ... on Text {
      editable_content: content(format: MARKDOWN)
      __typename
    }
    ... on Image {
      editable_alt_text: alt_text
      __typename
    }
  }
`);

const FullBlockMetadataPane_Fragment = graphql(/* GraphQL */ `
  fragment FullBlockMetadataPane on Konnectable {
    ... on Model {
      created_at_unix_time: created_at(format: "%s")
      created_at_timestamp: created_at
      created_at(relative: true)
      updated_at(relative: true)
      updated_at_timestamp: updated_at
      __typename
    }
    ... on ConnectableInterface {
      title
      description(format: HTML)
      user {
        __typename
        id
        name
        href
      }
      source {
        title
        url
        __typename
      }
      __typename
    }
    ... on Block {
      can {
        manage
        comment
        __typename
      }
      __typename
    }
    ...FullBlockActions
    ...ManageBlock
    __typename
  }
`);

const useBlockBottom = (id: string) => {
  const { authHeaders } = useSession();
  return useQuery({
    queryFn: async () => {
      const req = await request(apiUrl, BlockBottomQuery, { id }, authHeaders);
      return req;
    },
    queryKey: ["block", { id }],
  });
};

export default function BlockScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { data, isLoading } = useBlockBottom(id);

  const block = getFragmentData(FullBlock_Fragment, data?.block);
  const meta = getFragmentData(FullBlockMetadataPane_Fragment, block);
  const actions = getFragmentData(FullBlockActions_Fragment, meta);
  // wierd
  const source = actions?.source;

  const FullBlockContentPane = getFragmentData(
    FullBlockContentPane_Fragment,
    block
  );

  if (isLoading) return null;

  return (
    <ScreenLayout style={{ backgroundColor: "transparent" }}>
      {/* <ConnectPopup /> */}

      <ImageBackground />

      {(() => {
        switch (FullBlockContentPane?.__typename) {
          case "Image":
            const image = getFragmentData(
              FullBlockImage_Fragment,
              FullBlockContentPane
            );

            return (
              <View className={tw(`flex flex-1`)}>
                <ImageViewer
                  image={image?.image_url!}
                  initialImage={image?.src_1x!}
                  onDismiss={() => {
                    router.canGoBack() && router.back();
                  }}
                />
              </View>
            );

          case "Attachment":
            const attachment = getFragmentData(
              FullBlockAttachment_Fragment,
              FullBlockContentPane
            );

            return (
              <>
                <View
                  className={`fixed left-0 flex items-end`}
                  style={{
                    top: Constants.statusBarHeight,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      Linking.openURL(attachment?.file_url!);
                    }}
                    className={`border-accent-1 border bg-black w-[30%] m-2 flex justify-center items-center`}
                  >
                    <Text className={`text-accent-1 text-lg font-bold py-1 `}>
                      Dowload
                    </Text>
                  </Pressable>
                </View>
                <View className={tw(`flex flex-1 relative`)}>
                  <ImageViewer
                    image={attachment?.image_url!}
                    initialImage={attachment?.image_url!}
                    onDismiss={() => {
                      router.canGoBack() && router.back();
                    }}
                  />
                </View>
              </>
            );

          case "Link":
            const link = getFragmentData(
              FullBlockLink_Fragment,
              FullBlockContentPane
            );

            return (
              <View className={tw(`flex flex-1 relative`)}>
                <ImageViewer
                  image={link?.image_url!}
                  initialImage={link?.image_url!}
                  onDismiss={() => {
                    router.canGoBack() && router.back();
                  }}
                />
              </View>
            );

          case "Text":
            const text = getFragmentData(
              FullBlockText_Fragment,
              FullBlockContentPane
            );

            return (
              <View
                className={tw(
                  `flex flex-1 relative justify-center items-center`
                )}
              >
                <View
                  style={{
                    height: "60%",
                    minHeight: "60%",
                    marginBottom: "10%",
                    flexDirection: "row",
                  }}
                >
                  <ScrollView
                    contentContainerStyle={{
                      paddingHorizontal: 20,
                      paddingVertical: 20,
                      flexGrow: 1,
                    }}
                    scrollEnabled
                    className={`border border-accent-2 bg-black w-full h-full`}
                  >
                    <Text className={`text-accent-1 text-lg leading-6`}>
                      {text?.raw}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            );
          case "Embed":
            const embed = getFragmentData(
              FullBlockEmbed_Fragment,
              FullBlockContentPane
            );

            return (
              <View
                className={tw(
                  `flex flex-1 relative justify-center items-center`
                )}
              >
                <View
                  style={{
                    height: "50%",
                    minHeight: "60%",
                  }}
                >
                  <WebView
                    onError={(e) => {
                      console.log(e);
                    }}
                    style={{
                      width: Dimensions.get("window").width - 30,
                      flex: 1,
                    }}
                    source={{
                      html: embed?.embed_html || "<></>",
                    }}
                  ></WebView>
                </View>
              </View>
            );
          default:
        }
      })()}

      <BlockBottomSheet>
        <BlockBottomSheetConnections
          id={id}
          header={
            <>
              <Pressable
                onPress={() => {
                  router.replace("/(app)/(tabs)/");
                }}
                className={`flex justify-center items-center`}
                style={{
                  backgroundColor: "black",
                  zIndex: 9999,
                }}
              >
                <Text className={`text-accent-1 text-lg font-bold py-1`}>
                  G
                </Text>
              </Pressable>
              <BlockBottomSheetMeta meta={meta} />
              <BlockBottomSheetActions actions={actions} />
              <BlockBottomSheetFold id={id} />
            </>
          }
        />
      </BlockBottomSheet>
    </ScreenLayout>
  );
}
