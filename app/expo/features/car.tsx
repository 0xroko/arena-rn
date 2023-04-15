import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FC } from "react";
import { Dimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { Routes } from "../App";
import { Div, Img } from "./shared";

export const Car: FC<NativeStackScreenProps<Routes, "Test">> = ({
  navigation,
  route,
}) => {
  const width = Dimensions.get("window").width;

  return (
    <Div className={`bg-black flex-1 items-center justify-center`}>
      <Carousel
        width={width}
        loop={false}
        renderItem={({ item }) => (
          <Img
            className="w-full h-full"
            contentFit="contain"
            source={{
              uri: item.url,
            }}
          />
        )}
        data={[
          { id: 1, title: "First Item", url: "https://picsum.photos/200/300" },
          { id: 2, title: "Second Item", url: "https://picsum.photos/200/300" },
          { id: 3, title: "Third Item", url: "https://picsum.photos/200/300" },
        ]}
      ></Carousel>
    </Div>
  );
};
