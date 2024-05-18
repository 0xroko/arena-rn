import { router } from "expo-router";

interface ChannelRoute {
  id: number;
  href: string;
}

export const channelRoute = ({ href, id }: ChannelRoute) => {
  router.push({
    pathname: `/(app)/channel/${id}`,
    params: {
      href: href,
    },
  });
};
