import { channelVisibilityTextStyle } from "components/Blocks";
import { Link } from "expo-router";
import { tw } from "lib/tw";
import { Pressable, PressableProps, Text, TextProps, View } from "react-native";

interface HeaderTextProps extends TextProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const HeaderText = ({ children, ...props }: HeaderTextProps) => {
  return (
    <Text
      {...props}
      className={tw(
        `text-4xl tracking-tight font-bold leading-[34]`,
        props.className
      )}
    >
      {children}
    </Text>
  );
};

interface HeaderProps {
  children?: React.ReactNode | React.ReactNode[];
  userName?: string;
  channelName?: string;
  homePage?: boolean;
  channelVisibility?: string;
}

export const Header = ({
  children,
  channelName,
  userName,
  channelVisibility,
  homePage,
}: HeaderProps) => {
  const channelTextStyle = channelVisibilityTextStyle(channelVisibility);

  return (
    <View className={tw(`flex-row pb-20 pt-10`)}>
      <View className={`flex flex-1 mx-2`}>
        <View className={`flex flex-row `}>
          <View
            className={tw(`flex flex-row  `, {
              "flex-wrap": !homePage,
            })}
            style={{
              columnGap: 12,
              rowGap: homePage ? 0 : 0,
            }}
          >
            <Link href={"/(app)/(tabs)"}>
              <HeaderText className={`text-accent-2`}>Are.na</HeaderText>
            </Link>
            <HeaderText className={`text-accent-2`}>/</HeaderText>
            {!homePage ? (
              <>
                <HeaderText
                  className={tw(`text-accent-2`, {
                    "text-accent-1": !channelName,
                  })}
                >
                  {userName}
                </HeaderText>
                <HeaderText className={`text-accent-2`}>/</HeaderText>
                <HeaderText className={channelTextStyle}>
                  {channelName}
                </HeaderText>
              </>
            ) : (
              <View className={tw(`flex flex-col`)}>
                <HeaderText className={`text-accent-1`}>Explore</HeaderText>
                <HeaderText className={`text-accent-3`}>Feed</HeaderText>
                <HeaderText className={`text-accent-3`}>Me</HeaderText>
              </View>
            )}
          </View>
        </View>
        <View className={tw(`flex flex-col g-4 mt-12`)}>{children}</View>
      </View>
    </View>
  );
};

interface HeaderSectionProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const HeaderSection = ({ children }: HeaderSectionProps) => {
  return <View className={`flex flex-row g-10 pr-4`}>{children}</View>;
};

interface HeaderSectionTitleProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const HeaderSectionTitle = ({ children }: HeaderSectionTitleProps) => {
  return (
    <Text className={tw(`text-accent-2 font-medium basis-[12%] leading-7`)}>
      {children}
    </Text>
  );
};

interface HeaderSectionItemProps extends PressableProps {
  children?: React.ReactNode | React.ReactNode[];
  selected?: boolean;
}

export const HeaderSectionItem = ({
  children,
  selected,
  ...props
}: HeaderSectionItemProps) => {
  return (
    <Pressable {...props} className={tw(`flex`)}>
      <Text
        className={tw(`font-medium capitalize text-lg leading-7`, {
          "text-accent-1": selected,
          "text-accent-3": !selected,
        })}
      >
        {children}
      </Text>
    </Pressable>
  );
};

interface HeaderSectionContentProps {
  children?: React.ReactNode | React.ReactNode[];
}

export const HeaderSectionContent = ({
  children,
}: HeaderSectionContentProps) => {
  return (
    <View
      className={tw(`flex flex-row flex-wrap g-4 flex-1 flex-grow`)}
      style={{
        rowGap: 0,
        columnGap: 16,
      }}
    >
      {children}
    </View>
  );
};
