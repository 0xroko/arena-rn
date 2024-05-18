import { EmbedSvg, LinkSvg } from "components/Svg";
import { Image } from "expo-image";
import { router } from "expo-router";
import { getFragmentData, graphql } from "lib/gql";
import {
  KonnectableAttachmentFragment,
  KonnectableCellFragment,
  KonnectableChannelFragment,
  KonnectableEmbedFragment,
  KonnectableImageFragment,
  KonnectableLinkFragment,
  KonnectableTextFragment,
} from "lib/gql/graphql";
import { tw } from "lib/tw";

import {
  Linking,
  Text,
  TextProps,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import { useConnectDialogStore } from "store/connectDialogStore";

interface BlockProps extends ViewProps {
  children?: React.ReactNode | React.ReactNode[];
}
// has full width and padding
export const Block = ({ children, ...props }: BlockProps) => {
  return (
    <View {...props} className={`flex flex-1 items-center m-1 `}>
      {children}
    </View>
  );
};

interface BlockFooterProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockFooter = ({ children }: BlockFooterProps) => {
  return (
    <View className={`flex items-center flex-col justify-center mt-3 mb-4 g-1`}>
      {children}
    </View>
  );
};

interface BlockTitleProps extends TextProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockTitle = ({
  children,
  className,
  ...props
}: BlockTitleProps) => {
  return (
    <Text
      numberOfLines={2}
      className={tw(
        `text-neutral-400 text-sm leading-4 text-center `,
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
};

interface BlockContentProps extends ViewProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockContent = ({
  children,
  className,
  ...props
}: BlockContentProps) => {
  return (
    <View className={`flex items-center w-full aspect-square`}>
      <View
        className={tw(
          `w-full px-3 py-3 flex flex-1 justify-center items-center`,
          className
        )}
        {...props}
      >
        {children}
      </View>
    </View>
  );
};

interface BlockImageContentProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const BlockImageContent = ({ children }: BlockImageContentProps) => {
  return (
    <View className={`flex items-center w-full aspect-square`}>{children}</View>
  );
};

export const KonnectableImage_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableImage on Image {
    id
    title
    href
    alt_text
    src: image_url(size: DISPLAY)
    src_1x: resized_image_url(
      width: 315
      height: 315
      quality: 85
      fallback_format: PNG
    )
    src_2x: resized_image_url(width: 630, height: 630, fallback_format: PNG)
    src_3x: resized_image_url(width: 500, height: 500, fallback_format: PNG)
    original_dimensions {
      width
      height
      __typename
    }
    __typename
  }
`);

interface ImageBlockProps {
  children?: React.ReactNode | React.ReactNode[];
  image: KonnectableImageFragment;
}

export const ImageBlock = ({ children, image }: ImageBlockProps) => {
  return (
    <Block>
      <BlockImageContent>
        <Image
          contentFit="contain"
          recyclingKey={image.id.toString()}
          className={`w-full h-full `}
          placeholder={{
            blurhash: "L00000fQfQfQfQfQfQfQfQfQfQfQ",
          }}
          // cachePolicy="none"
          style={{ aspectRatio: 1, flex: 1, margin: 0 }}
          source={{
            uri: image.src_1x!,
          }}
        />
      </BlockImageContent>
      <BlockFooter>
        <BlockTitle>{image.title.slice(0, 20)}</BlockTitle>
      </BlockFooter>
    </Block>
  );
};

const KonnectableChannel_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableChannel on Channel {
    id
    truncatedTitle: title(truncate: 80)
    visibility
    updated_at(relative: true)
    counts {
      __typename
      contents
    }
    owner {
      __typename
      ... on Group {
        id
        name
        visibility
        __typename
      }
      ... on User {
        id
        name
        __typename
      }
    }
    ...KonnectableChannelOverlay
    ...LoadingBreadcrumbChannel
    __typename
  }
`);

interface ChannelProps {
  children?: React.ReactNode | React.ReactNode[];
  channel: KonnectableChannelFragment;
}

export const channelVisibilityTextStyle = (visibility?: string) => {
  switch (visibility) {
    case "public":
      return "text-green-1";
    case "closed":
      return "text-accent-1";
    case "private":
      return "text-red-1";
    default:
      return "text-accent-1";
  }
};

export const channelVisibilityBorderColor = (visibility?: string) => {
  switch (visibility) {
    case "public":
      return "border-green-1";
    case "closed":
      return "border-accent-1";
    case "private":
      return "border-red-1";
    default:
      return "border-accent-1";
  }
};

export const Channel = ({ children, channel }: ChannelProps) => {
  const channelTextStyle = channelVisibilityTextStyle(channel.visibility);

  const channelBorderStyle = channelVisibilityBorderColor(channel.visibility);

  return (
    <Block>
      <BlockContent className={tw(`border justify-around`, channelBorderStyle)}>
        <View className={`flex flex-col`}>
          <Text className={tw(`text-xl text-center`, channelTextStyle)}>
            {channel.truncatedTitle}
          </Text>
        </View>
        <View className={tw(`flex flex-col g-1`)}>
          <Text className={tw(`text-sm text-center`, channelTextStyle)}>
            by {channel.owner.name}
          </Text>
          <Text className={tw(`text-sm text-center`, channelTextStyle)}>
            {channel.counts.contents} blocks • {channel.updated_at}
          </Text>
        </View>
      </BlockContent>
      <BlockFooter />
    </Block>
  );
};

const KonnectableAttachment_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableAttachment on Attachment {
    id
    title
    href
    file_extension
    image_url(size: DISPLAY)
    __typename
  }
`);

interface AttachmentBlockProps {
  children?: React.ReactNode | React.ReactNode[];
  attachment: KonnectableAttachmentFragment;
}

export const AttachmentBlock = ({
  children,
  attachment,
}: AttachmentBlockProps) => {
  return (
    <Block>
      {attachment.image_url ? (
        <BlockImageContent>
          <Image
            contentFit="contain"
            recyclingKey={attachment.id.toString()}
            className={`w-full h-full `}
            placeholder={{
              blurhash: "L00000fQfQfQfQfQfQfQfQfQfQfQ",
            }}
            // cachePolicy="none"
            style={{ aspectRatio: 1, flex: 1, margin: 0 }}
            source={{
              uri: attachment.image_url,
            }}
          />
        </BlockImageContent>
      ) : (
        <BlockContent className={tw(`bg-accent-3`)}>
          <Text className={`text-accent-2 uppercase text-3xl font-bold`}>
            {attachment.file_extension}
          </Text>
        </BlockContent>
      )}
      <BlockFooter>
        {attachment.title && (
          <BlockTitle className={`h-4`} numberOfLines={1}>
            {attachment.title}
          </BlockTitle>
        )}
        <View className={tw(`h-4  bg-accent-3 `)}>
          <Text
            className={`text-accent-2 uppercase text-2xs font-bold text-center px-1`}
          >
            {attachment.file_extension}
          </Text>
        </View>
      </BlockFooter>
    </Block>
  );
};

const KonnectableEmbed_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableEmbed on Embed {
    id
    title
    href
    src: image_url(size: DISPLAY)
    src_1x: resized_image_url(width: 315, height: 315, quality: 85)
    src_2x: resized_image_url(width: 630, height: 630)
    src_3x: resized_image_url(width: 945, height: 945)
    __typename
  }
`);

interface EmbedBlockProps {
  children?: React.ReactNode | React.ReactNode[];
  embed: KonnectableEmbedFragment;
}

export const EmbedBlock = ({ children, embed }: EmbedBlockProps) => {
  return (
    <Block>
      <BlockImageContent>
        <Image
          contentFit="contain"
          recyclingKey={embed.id.toString()}
          className={`w-full h-full `}
          placeholder={{
            blurhash: "L00000fQfQfQfQfQfQfQfQfQfQfQ",
          }}
          // cachePolicy="none"
          style={{ aspectRatio: 1, flex: 1, margin: 0 }}
          source={{
            uri: embed.src_1x!,
          }}
        />
      </BlockImageContent>
      <BlockFooter>
        {embed.title && (
          <BlockTitle className={`h-4`} numberOfLines={1}>
            {embed.title}
          </BlockTitle>
        )}
        <View className={tw(`w-4 h-4`)}>
          <EmbedSvg width={"100%"} height={"100%"} />
        </View>

        {/* todo figure out display: inline */}
        {/* <View className={`w-4 h-4`}>
        <EmbedSvg width={"100%"} height={"100%"} />
      </View> */}
      </BlockFooter>
    </Block>
  );
};

const KonnectableText_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableText on Text {
    id
    title
    href
    html: content(format: HTML)
    raw: content(format: MARKDOWN)
    __typename
  }
`);

interface TextBlockProps {
  children?: React.ReactNode | React.ReactNode[];
  text: KonnectableTextFragment;
}

export const TextBlock = ({ children, text }: TextBlockProps) => {
  return (
    <Block>
      <BlockContent
        className={tw(`border border-accent-3 items-start justify-start`)}
      >
        <Text className={`text-white`} ellipsizeMode="tail">
          {text.raw}
        </Text>
      </BlockContent>
      <BlockFooter>
        <BlockTitle>{text.title}</BlockTitle>
      </BlockFooter>
    </Block>
  );
};

const KonnectableLink_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableLink on Link {
    href
    title
    src: image_url(size: DISPLAY)
    src_1x: resized_image_url(
      width: 415
      height: 415
      quality: 90
      fallback_format: PNG
    )
    src_2x: resized_image_url(width: 630, height: 630, fallback_format: PNG)
    src_3x: resized_image_url(width: 945, height: 945, fallback_format: PNG)
    external_url: source_url
    content(format: HTML)
    __typename
  }
`);

interface LinkBlockProps {
  children?: React.ReactNode | React.ReactNode[];
  link: KonnectableLinkFragment;
}

export const LinkBlock = ({ children, link }: LinkBlockProps) => {
  return (
    <Block>
      <BlockImageContent>
        <Image
          contentFit="contain"
          recyclingKey={link.href?.toString()}
          className={`w-full h-full `}
          placeholder={{
            blurhash: "L00000fQfQfQfQfQfQfQfQfQfQfQ",
          }}
          // cachePolicy="none"
          style={{ aspectRatio: 1, flex: 1, margin: 0 }}
          source={{
            uri: link.src_1x!,
          }}
        />
      </BlockImageContent>
      <BlockFooter>
        <BlockTitle>
          <LinkSvg
            width={"16"}
            height={"12"}
            fill={"currentColor"}
            style={{}}
            className={`text-neutral-400 inline`}
          />{" "}
          {link.title}
        </BlockTitle>

        {/* <View className={`w-4 h-3`}></View> */}
      </BlockFooter>
    </Block>
  );
};

export const KonnectableCell_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableCell on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ... on ConnectableInterface {
      href
      __typename
    }
    ... on Block {
      count: counts {
        comments
        __typename
      }
      __typename
    }
    ...KonnectableDisplay
    ...KonnectableMetadata
    ...KonnectableBlockOverlay
    ...LoadingBreadcrumbChannel
  }
`);

export const KonnectableDisplay_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableDisplay on Konnectable {
    __typename
    ... on Model {
      id
      __typename
    }
    ...KonnectableChannel
    ...KonnectableText
    ...KonnectableImage
    ...KonnectableLink
    ...KonnectableEmbed
    ...KonnectableAttachment
    ...KonnectableMetadata
  }
`);

const KonnectableMetadata_Fragment = graphql(/* GraphQL */ `
  fragment KonnectableMetadata on Konnectable {
    ... on Model {
      updated_at(relative: true)
      __typename
    }
    ... on ConnectableInterface {
      title
      user {
        id
        name
        __typename
      }
      connection {
        created_at(relative: true)
        user {
          id
          name
          __typename
        }
        __typename
      }
      ... on Attachment {
        file_extension
        __typename
      }

      ... on Link {
        source_url

        __typename
      }
      __typename
    }
    __typename
  }
`);

interface KonnectableCellProps {
  children?: React.ReactNode | React.ReactNode[];
  cell?: KonnectableCellFragment | null;
}
export const KonnectableCell = ({ children, cell }: KonnectableCellProps) => {
  const displayFragment = getFragmentData(KonnectableDisplay_Fragment, cell);
  const metadata = getFragmentData(KonnectableMetadata_Fragment, cell);

  const connectDialog = useConnectDialogStore((t) => t.navigate);

  return (
    <TouchableOpacity
      onPress={() => {
        console.log(cell);
        if (metadata?.__typename === "Link") {
          Linking.openURL(metadata.source_url!);
        } else {
          if (!cell?.href) return;
          router.push({
            pathname: `/(app)${cell.href}` as any,
            params: {
              id: cell.id,
            },
          });
        }
      }}
      delayLongPress={300}
      onLongPress={() => {
        if (!displayFragment) return;
        connectDialog(
          displayFragment?.id,
          displayFragment?.__typename === "Channel" ? "Channel" : "Block"
        );
      }}
    >
      {(() => {
        switch (displayFragment?.__typename) {
          case "Image":
            const image = getFragmentData(
              KonnectableImage_Fragment,
              displayFragment
            );
            return <ImageBlock image={image} />;
          case "Channel":
            const c = getFragmentData(
              KonnectableChannel_Fragment,
              displayFragment
            );
            return <Channel channel={c} />;
          case "Link":
            const l = getFragmentData(
              KonnectableLink_Fragment,
              displayFragment
            );
            return <LinkBlock link={l} />;
          case "Text":
            const text = getFragmentData(
              KonnectableText_Fragment,
              displayFragment
            );
            return <TextBlock text={text} />;
          case "Embed":
            const embed = getFragmentData(
              KonnectableEmbed_Fragment,
              displayFragment
            );
            return <EmbedBlock embed={embed} />;
          case "Attachment":
            const a = getFragmentData(
              KonnectableAttachment_Fragment,
              displayFragment
            );
            return <AttachmentBlock attachment={a} />;
          default:
            return (
              <Block className={`bg-red-600 flex-1`}>
                <BlockContent></BlockContent>
                <BlockFooter />
              </Block>
            );
        }
      })()}
    </TouchableOpacity>
  );
};
