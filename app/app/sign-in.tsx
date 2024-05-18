import { ScreenLayout } from "components";
import { useSession } from "context/auth";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

export default function SignIn() {
  const { signIn, setSessionManual } = useSession();
  const [token, setToken] = useState<string>("");
  return (
    <ScreenLayout>
      <View className={`flex justify-center items-center flex-1 g-4`}>
        <Text className={`text-accent-1`}></Text>

        <View className={`flex flex-row`}>
          <View className={`flex flex-row flex-1 `}>
            <Pressable
              android_ripple={{ color: "#FFFFFF22" }}
              onPress={() => {
                signIn();
                // Navigate after signing in. You may want to tweak this to ensure sign-in is
                // successful before navigating.
                router.replace("/(app)/(tabs)");
              }}
              className={`bg-accent-9 border-accent-3 rounded-sm border flex-1 flex justify-center items-center`}
            >
              <Text className={`text-accent-1 font-bold py-3 px-4`}>
                Sign in with Are.na
              </Text>
            </Pressable>
          </View>
        </View>
        <View className={`flex flex-row`}>
          <Text className={`text-accent-1 text-center`}>
            You will have to login with access token if you want to use
            "private" features (until Are.na supports third party GraphQL apps)
          </Text>
        </View>
        <View className={`flex flex-row`}>
          <View
            className={`flex flex-1 flex-row items-center g-4 justify-between`}
          >
            <TextInput
              placeholder="Enter token"
              placeholderTextColor={"#FFFFFF22"}
              onChange={(e) => {
                setToken(e.nativeEvent.text);
              }}
              value={token}
              className={`text-base flex-1 bg-black border text-accent-1 border-accent-3 py-2 px-3 `}
            ></TextInput>
            <View className={`flex flex-row flex-1 `}>
              <Pressable
                onPress={() => {
                  if (token.length > 0) {
                    setSessionManual(token);
                    console.log("token", token);
                  }
                }}
                className={`bg-accent-9 border-accent-3 rounded-sm border flex-1 flex justify-center items-center`}
              >
                <Text className={`text-accent-1 font-bold py-3 px-4`}>
                  Enter token manually
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
