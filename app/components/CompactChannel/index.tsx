import {
  channelVisibilityBorderColor,
  channelVisibilityTextStyle,
} from "components/Blocks";
import { router } from "expo-router";
import { graphql } from "lib/gql";
import { CompactChannelFragment } from "lib/gql/graphql";
import { Text, TouchableNativeFeedback, View } from "react-native";

export const CompactChannel_Fragment = graphql(/* GraphQL */ `
  fragment CompactChannel on Channel {
    __typename
    id
    href
    visibility
    title
    owner {
      ... on Group {
        __typename
        id
        name
        visibility
      }
      ... on User {
        __typename
        id
        name
      }
      __typename
    }
    counts {
      contents
      __typename
    }
    ...LoadingBreadcrumbChannel
  }
`);

interface CompactChannelProps {
  children?: React.ReactNode | React.ReactNode[];
  channel: CompactChannelFragment;
}

export const CompactChannel = ({ children, channel }: CompactChannelProps) => {
  const channelTextStyle = channelVisibilityTextStyle(channel.visibility);
  const channelBorderStyle = channelVisibilityBorderColor(channel.visibility);

  return (
    <TouchableNativeFeedback
      onPress={() => {
        router.push({
          pathname: `/(app)/${channel.href}`,
          params: { id: channel.id },
        });
      }}
    >
      <View
        className={`flex px-3 py-4 flex-row justify-between  items-center border my-1 ${channelBorderStyle}`}
      >
        <View
          className={`flex flex-col items-start flex-wrap flex-1`}
          style={{
            columnGap: 12,
            rowGap: 0,
          }}
        >
          <Text className={`text-lg ${channelTextStyle}`}>{channel.title}</Text>
          <Text className={`${channelTextStyle}`}>
            {channel.counts.contents} blocks
          </Text>
        </View>
        <View className={`flex flex-wrap flex-row justify-end`}>
          <Text numberOfLines={2} className={`${channelTextStyle} text-right`}>
            by {channel.owner.name}
          </Text>
        </View>
      </View>
    </TouchableNativeFeedback>
  );
};
