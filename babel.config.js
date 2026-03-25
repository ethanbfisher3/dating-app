module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "babel-plugin-dotenv",
        {
          moduleName: "@react-native-dotenv",
          path: ".env.local",
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  }
}
