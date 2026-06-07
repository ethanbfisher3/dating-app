import React from "react";
import { Text, type TextProps } from "react-native";

const AppText = React.forwardRef<any, TextProps>(({ style, ...props }, ref) => {
  return <Text ref={ref} {...props} style={[{ fontFamily: "SuperMindset" }, style]} />;
});

AppText.displayName = "AppText";

export default AppText;
