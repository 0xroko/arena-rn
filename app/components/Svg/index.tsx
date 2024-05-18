import Svg, { Path, SvgProps } from "react-native-svg";

interface LinkSvgProps extends SvgProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const LinkSvg = ({ children, ...props }: LinkSvgProps) => {
  return (
    <Svg viewBox="0 0 16 16" {...props}>
      <Path d="M10.165 6.635a3.798 3.798 0 0 1 .01 5.364l-.01.01-1.68 1.68a3.804 3.804 0 0 1-5.374 0 3.804 3.804 0 0 1 0-5.374l.928-.928a.4.4 0 0 1 .682.265c.017.443.096.888.243 1.318a.402.402 0 0 1-.095.416l-.327.327c-.7.7-.723 1.841-.03 2.549.702.714 1.853.719 2.56.013l1.68-1.68a1.8 1.8 0 0 0-.26-2.76.4.4 0 0 1-.124-.137.4.4 0 0 1-.05-.178.996.996 0 0 1 .293-.745l.527-.527a.402.402 0 0 1 .514-.043c.184.128.355.272.513.43zM13.69 3.11a3.804 3.804 0 0 0-5.374 0l-1.68 1.68-.01.01a3.798 3.798 0 0 0 .523 5.794c.16.112.376.095.514-.043l.527-.527a.996.996 0 0 0 .292-.745.401.401 0 0 0-.05-.178.401.401 0 0 0-.124-.137 1.8 1.8 0 0 1-.259-2.76l1.68-1.68a1.802 1.802 0 0 1 2.559.013c.694.708.672 1.849-.029 2.55l-.327.326a.402.402 0 0 0-.095.416c.147.43.226.875.243 1.318a.4.4 0 0 0 .682.265l.928-.928a3.804 3.804 0 0 0 0-5.374z"></Path>
    </Svg>
  );
};

interface EmbedSvgProps extends SvgProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const EmbedSvg = ({ children, ...props }: EmbedSvgProps) => {
  return (
    <Svg fill="none" viewBox="0 0 16 12" {...props}>
      <Path fill="#2F2F2F" d="M0 0h16v12H0z" />
      <Path fill="#6E6E6E" d="M12 6 6 9.464V2.536L12 6Z" />
    </Svg>
  );
};
