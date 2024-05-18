import { router } from "expo-router";
import { create } from "zustand";

type ConnectableType = "Block" | "Channel";
interface UseConnectDialogStore {
  current: {
    id: string | number;
    type: ConnectableType;
  };
  setCurrent: (id: string | number, type: ConnectableType) => void;
  navigate: (id: string | number, type: ConnectableType) => void;
}

export const useConnectDialogStore = create<UseConnectDialogStore>((set) => ({
  current: {
    id: "",
    type: "Block",
  },
  setCurrent: (id, type) => set({ current: { id, type } }),
  navigate: (id, type) => {
    set({ current: { id, type } });
    router.push("/(app)/connect");
  },
}));
