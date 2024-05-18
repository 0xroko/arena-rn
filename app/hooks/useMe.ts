import { useQuery } from "@tanstack/react-query";
import { useSession } from "context/auth";
import { ArenaUserWithDetails } from "types/arena";

export const useMe = () => {
  const { restHeaders } = useSession();
  return useQuery({
    queryFn: async () => {
      const req = await fetch("https://api.are.na/v2/me", {
        headers: {
          ...restHeaders,
        },
        method: "GET",
      });
      const j = await req.json();

      return j as ArenaUserWithDetails;
    },
    queryKey: ["me"],
    refetchOnMount: false,
  });
};
