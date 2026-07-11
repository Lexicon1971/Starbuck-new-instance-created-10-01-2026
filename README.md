<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XdUUYO_Nf2secMvVzLk7WWYzRu9Au0PZ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Troubleshooting Common Console Warnings

### 1. `read.js:2530 READ - Host validation failed` / `Host is not supported`
- **Cause:** This error is injected by an installed browser extension (such as the ElevenLabs Conversational Agent extension, "Read Aloud", or another Text-To-Speech reader extension) that attempts to validate the hostname of the page you are browsing. Since local development servers typically run on `localhost` or `127.0.0.1`, the extension's self-validation fails and logs this error.
- **Solution:**
  1. Open your browser's Extensions manager (e.g. `chrome://extensions`).
  2. Locate the Text-to-Speech or AI Reader extension.
  3. Go to the extension's settings/dashboard and add `127.0.0.1:3000` or `localhost:3000` to its Allowlist/Whitelist.
  4. Alternatively, temporarily toggle off the extension while developing locally.

### 2. `FirebaseError / Uncaught (in promise) {code: 403, ...}`
- **Cause:** This warning is triggered by Firebase/Firestore when rules are locked, or if the domain is not authorized in your Firebase console under "Authorized Domains" (e.g. running on a local development subpath).
- **Solution:**
  - The application automatically captures and handles these background network synchronization warnings gracefully so they do not crash the game or clutter the console.
  - If you are integrating a custom database, make sure to add your domain/localhost to the Firebase Console -> Auth -> Authorized Domains section and ensure your Firestore Rules allow read/write access.
