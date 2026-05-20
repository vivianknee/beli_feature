# iOS Share Extension

The share extension allows users to share a TikTok or Instagram Reel directly to this app from the native iOS share sheet.

## Setup

Share extensions require a native Xcode target — they cannot be configured through Expo's managed workflow alone.

### Steps

1. **Eject to bare workflow** (or use `expo prebuild`):
   ```bash
   cd app
   npx expo prebuild
   ```

2. **Open the generated Xcode project** (`ios/BeliReelSaver.xcworkspace`)

3. **Add a new target**: File → New → Target → Share Extension
   - Name it `BeliShareExtension`
   - Set Deployment Target to iOS 16+

4. **Configure the extension** to accept URLs:
   In `BeliShareExtension/Info.plist`, set:
   ```xml
   <key>NSExtensionActivationRule</key>
   <dict>
     <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
     <integer>1</integer>
   </dict>
   ```

5. **In the extension's `ShareViewController.swift`**:
   - Extract the shared URL from `extensionContext`
   - Open a deep link into the main app: `beli-reel-saver://extract?url=<encoded_url>`
   - The main app handles `beli-reel-saver://` URLs and kicks off extraction automatically

6. **Register the URL scheme** in `app.json`:
   ```json
   {
     "expo": {
       "scheme": "beli-reel-saver"
     }
   }
   ```

## Deep Link Handling

The main app's `App.tsx` uses `Linking.addEventListener` to intercept
`beli-reel-saver://extract?url=...` deep links and immediately start extraction.
This is not wired up yet — see the TODO in `App.tsx`.
