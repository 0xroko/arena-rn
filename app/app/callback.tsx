import { Redirect } from "expo-router";

export default function AuthCallback() {
  console.log("AuthCallback");

  return <Redirect href={"/_layout"} />;
}
