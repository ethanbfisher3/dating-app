import React from "react";
import { Text, StyleSheet, type TextProps } from "react-native";

const FONT_SCALE = 1.3;

const AppText = React.forwardRef<any, TextProps>(({ style, ...props }, ref) => {
  const flat = StyleSheet.flatten(style);
  const scaledFontSize = flat?.fontSize != null ? flat.fontSize * FONT_SCALE : 15.4;
  return <Text ref={ref} {...props} style={[{ fontFamily: "SuperMindset" }, style, { fontSize: scaledFontSize }]} />;
});

AppText.displayName = "AppText";

export default AppText;
