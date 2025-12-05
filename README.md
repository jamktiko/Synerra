# Synerra

A social web-application that connects gamers together.

## Overview

Make an account and find other players categorized by games, language, compepitiveness and more. Contact them with realtime chat and start enjoying games like never before!

## Features

- Realtime chat
  - Direct message and group chats
- Realtime notifications
  - Friend requests, messages, online status
- Wide range of player filters
- Login with email and Google
- Modern and accessible UI
- Fast and easy profile setup
- Profile customization

## Installation

```
git clone https://github.com/jamktiko/Synerra
cd Synerra/frontend
npm install
cd ../backend
npm install
```

## Configuration

You need to do a shit ton of ur own configs for this to work lmfao

### Serverless YML

Change COGNITO_DOMAIN to match your Cognito domain and change the REDICRECT_URI to localhost:4200 if running the project locally

```
    COGNITO_DOMAIN: 'https://synerra.auth.eu-north-1.amazoncognito.com'
    REDIRECT_URI: 'https://d2lqv34okdzcq4.cloudfront.net/auth/callback'
```

Also if you want to play around with the profile-pictures for users you need to create your own S3-bucket and replace all of the previous synerra-pfp bucket references from the serverless.yml file AND upload.js

### Google login

If you want the Google login to work on your own AWS host, you need to set up your own Google API client ID and some things in AWS Cognito. If you host the frontend locally, use localhost:4200 instead of cloudfront urls.

#### Google Cloud Console

Setting up the Google API client ID is easy and you can esily achieve this by following the part 1 of this guide:
https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

- **Authorized JavaScript origins:**
  - `https://abcd1234.cloudfront.net` or `localhost:4200`
- **Authorized redirect URIs:**
  - `https://YourApp.auth.region.amazoncognito.com/oauth2/idpresponse`

#### AWS Cognito

- **Identity providers:**
  - Add Google and enter the **Client ID** and **Client Secret** from your Google project.
- **App Client settings:**
  - Callback URL: `https://abcd1234.cloudfront.net/auth/callback` or `localhost:4200/auth/callback`
  - Signout URL: `https://abcd1234.cloudfront.net/login`'
- **Managed Login**
  - Add custom style

## Running the app

### Frontend:

```
cd frontend
ng serve
```

### Backend:

```
cd backend
serverless deploy
```

## Testing

The app has built-in unit and end-to-end -tests

### Frontend unit tests:

```
cd frontend
npm run test
```

### Frontend e2e tests:

```
cd frontend
npm run cypress:run
```

### Backend unit tests:

```
cd backend
npm run test
```
