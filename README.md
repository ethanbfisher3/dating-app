# BYU Dating - React Native (Expo)

This is a minimal Expo-based React Native scaffold converted from the web app.

Quick start

1. Install dependencies (requires Node.js and npm/yarn):

```bash
cd "C:\Users\ethan\Apps\byu-dating"
npm install
```

2. Start Expo

```bash
npm start
# or
npx expo start
```

3. Open the project in Expo Go on your phone or run on an emulator.

Notes

- This initial conversion includes data from the original project (see `src/data/DateIdeas.js`).
- Many pages are placeholders; I can continue porting components and styles on request.

Additional notes & quick commands

- If you want the app to load the same images used by the web project, copy the `public/images` folder from the original website into this project's `assets/images` folder. On Windows you can run:

```powershell
robocopy "C:\Users\ethan\Websites\byu-dating\public\images" "C:\Users\ethan\Apps\byu-dating\assets\images" /E
```

- The app currently maps relative `/images/...` paths to local `file:///C:/Users/ethan/Websites/byu-dating/public/...` URIs so images load when running on the same machine. If you prefer bundling assets for Expo, I can convert data entries to `require()` imports and add them to `assets`.

- To run:

```bash
cd "C:\Users\ethan\Apps\byu-dating"
npm install
npm start
# or
npx expo start
```

If anything fails during `expo start`, run the Metro/packager logs and I can help fix the specific errors.
