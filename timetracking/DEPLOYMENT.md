# Firebase Deployment Guide

This guide walks you through deploying your HCM Time Tracking app to Firebase (fullstack + free tier).

## Prerequisites

- Firebase account
- Node.js installed
- Your Firebase project ID from Firebase Console

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

## Step 3: Update Firebase Project ID

Edit `.firebaserc` and replace `your-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

You can find your project ID in the [Firebase Console](https://console.firebase.google.com).

## Step 4: Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 5: Build Your Frontend

```bash
npm run build
```

## Step 6: Deploy Everything

Deploy both hosting (frontend) and functions (backend):

```bash
firebase deploy
```

Or deploy separately:

```bash
# Deploy only frontend
firebase deploy --only hosting

# Deploy only backend
firebase deploy --only functions
```

## Step 7: Access Your App

After deployment, Firebase will provide URLs:

- **Frontend**: `https://your-project-id.web.app`
- **API**: Accessible via `/api/*` routes (automatically routed through hosting)

## Environment Variables

The app is configured to use relative API paths in production (via Firebase rewrites), so no additional configuration needed.

If you need to use a separate API domain:
1. Edit `.env.production`
2. Set `VITE_API_URL=https://REGION-PROJECT_ID.cloudfunctions.net/api`
3. Rebuild: `npm run build`

## Monitoring

- **Logs**: `firebase functions:log`
- **Console**: [Firebase Console](https://console.firebase.google.com)

## Troubleshooting

### Functions deployment fails
- Check that you're on Node 20 (Firebase Functions v2 requirement)
- Run `cd functions && npm install` to ensure dependencies are installed

### Frontend shows 404 on API calls
- Verify firebase.json rewrites are configured correctly
- Check that functions deployed successfully: `firebase functions:list`

### CORS errors
- Cloud Functions include CORS headers by default
- If issues persist, check browser console for specific error

## Cost Monitoring

All features are free tier eligible:
- Functions: 2M invocations/month
- Hosting: 10GB storage, 360MB/day bandwidth
- Firestore: Already configured

Monitor usage: [Firebase Console > Usage](https://console.firebase.google.com)

## Updating Your App

After making changes:

```bash
# Rebuild frontend
npm run build

# Redeploy everything
firebase deploy
```

Or update only what changed:
```bash
firebase deploy --only hosting  # Frontend only
firebase deploy --only functions # Backend only
```
