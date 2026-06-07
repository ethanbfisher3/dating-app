import React from "react";
import { TextInput, type TextProps } from "react-native";

const AppTextInput = React.forwardRef<any, TextProps>(({ style, ...props }, ref) => {
  return <TextInput ref={ref} {...props} style={[{ fontFamily: "SuperMindset" }, style]} />;
});

AppTextInput.displayName = "AppTextInput";

export default AppTextInput;
