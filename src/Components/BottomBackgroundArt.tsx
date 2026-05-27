import React from "react";
import { Image, StyleSheet, View } from "react-native";

type BottomBackgroundArtProps = {
  bottomOffset?: number;
};

export default function BottomBackgroundArt({ bottomOffset = 0 }: BottomBackgroundArtProps) {
  return null;
  // <View pointerEvents="none" style={[styles.container, { bottom: bottomOffset }]}>
  //   <Image source={require("../assets/images/datecraft_background_large.png")} style={styles.image} resizeMode="cover" />
  // </View>
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1000,
    zIndex: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
