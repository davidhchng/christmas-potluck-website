# 🎄 Holiday Potluck & Housewarming

RSVP + potluck sign-up site. Plain HTML/CSS/JS, no build step. It's hosted on GitHub Pages, and Firebase stores the shared data.

## Files

| File | What it's for |
|---|---|
| `config.js` | **Edit this first.** Date/time, address, food categories, and the Firebase config |
| `index.html` | Page layout |
| `styles.css` | Styling |
| `app.js` | RSVP and food sign-up logic |
| `store.js` | Saves data to Firebase, or to your own browser in demo mode |

## Run locally

ES modules don't load from `file://`, so start a tiny local server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Make data shared (Firebase, free)

Without this the site runs in **demo mode**: RSVPs only save in your own browser.

1. Go to <https://console.firebase.google.com> → **Add project** (you can turn off Analytics).
2. **Build → Firestore Database → Create database** → pick a region → start in **production mode**.
3. In the **Rules** tab, paste this and **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /{col}/{id} {
         allow read: if col in ['rsvps', 'dishes'];
         allow create: if col in ['rsvps', 'dishes']
                       && request.resource.data.name is string
                       && request.resource.data.name.size() <= 60;
         allow delete: if col in ['rsvps', 'dishes'];
         allow update: if false;
       }
     }
   }
   ```
4. **Project settings (⚙️) → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` object.
5. Paste it into `config.js`:
   ```js
   export const FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     // ...
   };
   ```
   The Firebase web config is meant to be public, so it's fine to commit. The rules above are what protect the data.

> Note: anyone with the link can technically delete entries (the ✕ button only *shows* on your own). That's fine for a friends party. If someone trolls you, add Firebase Anonymous Auth.

## Deploy to GitHub Pages

```sh
git add . && git commit -m "Potluck site"
git remote add origin https://github.com/<you>/christmas-potluck-website.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from branch → `main` / root**. Your site will be at
`https://<you>.github.io/christmas-potluck-website/`.
