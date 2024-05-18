import { ScreenLayout } from "components";
import { ConnectPopup } from "components/ConnectPopup";
import { View } from "react-native";

export default function ConnectModal() {
  return (
    <ScreenLayout style={{ backgroundColor: "#00000000" }}>
      <View
        style={{ backgroundColor: "#00000066" }}
        className={`absolute top-0 w-full h-full left-0 `}
      ></View>
      <ConnectPopup />
    </ScreenLayout>
  );
}
