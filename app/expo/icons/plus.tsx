import Svg, { Path, SvgProps } from "react-native-svg";

export const Plus = ({ ...s }: SvgProps) => {
  return (
    <Svg fill="none" viewBox="0 0 24 24" {...s}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </Svg>
  );
};
