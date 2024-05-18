import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { channelVisibilityTextStyle } from "components/Blocks";
import { useSession } from "context/auth";
import { router } from "expo-router";
import { tw } from "lib/tw";
import { Text, View } from "react-native";
import { TouchableNativeFeedback } from "react-native-gesture-handler";
import { useConnectDialogStore } from "store/connectDialogStore";
import { ArenaChannelWithDetails } from "types/arena";
// channels/:channel_id/blocks/:id/selection - PUT
const useConnectTo = () => {
  const { restHeaders } = useSession();

  return useMutation({
    mutationFn: async ({
      blockId,
      channelSlug,
      type,
    }: {
      blockId: any;
      channelSlug: string;
      type: "Block" | "Channel";
    }) => {
      const body = {
        connectable_id: blockId,
        connectable_type: type,
      };

      await axios.request({
        headers: {
          ...restHeaders,
          "Content-Type": "application/json",
        },
        url: `https://api.are.na/v2/channels/${channelSlug}/connections`,
        method: "POST",
        data: body,
      });
    },
  });
};

interface SelectableChannelProps {
  children?: React.ReactNode | React.ReactNode[];
  channel?: ArenaChannelWithDetails;
}

export const SelectableChannel = ({
  children,
  channel,
  ...props
}: SelectableChannelProps) => {
  const {
    mutateAsync: connectTo,
    isLoading,
    isSuccess,
    status,
  } = useConnectTo();
  const textStyle = channelVisibilityTextStyle(channel?.status);
  const block = useConnectDialogStore((s) => s.current);

  const onPress = async () => {
    await connectTo({
      blockId: block?.id || "",
      channelSlug: channel?.slug || "",
      type: block.type,
    });
  };

  return (
    <TouchableNativeFeedback
      disabled={isSuccess}
      onPress={onPress}
      onLongPress={() => {
        router.push(`/channel/${channel?.id?.toString() ?? ""}`);
      }}
    >
      <View
        className={tw(
          `bg-accent-9 flex flex-row py-3.5 g-1 px-2 border-accent-3 border-x`,
          {
            "bg-accent-3": isLoading || isSuccess,
          }
        )}
      >
        <Text className={`text-accent-1`}>{channel?.user?.username}</Text>
        <Text className={`text-accent-1`}>/</Text>
        <Text className={`${textStyle}`}>{channel?.title}</Text>
      </View>
    </TouchableNativeFeedback>
  );
};
