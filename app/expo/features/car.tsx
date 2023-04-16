import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FC } from "react";
import { Dimensions } from "react-native";
import { Routes } from "../App";
import { Div, T } from "./shared";

export const Car: FC<NativeStackScreenProps<Routes, "Test">> = ({
  navigation,
  route,
}) => {
  const width = Dimensions.get("window").width;

  return (
    <Div className={`bg-black flex-1 items-center justify-center flex-row`}>
      <Div className={`flex flex-1`}>
        <Div className={`bg-black border-2 border-white px-4 py-4`}>
          <T className={`text-white text-2xl`}>TTTTT</T>
          <T className={`text-white`}>This is test • 34 min ago</T>
        </Div>
      </Div>
    </Div>
  );
};
