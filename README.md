# Synerra

A social web-application that connects gamers together

## Overview

Make an account and find other players categorized by games, language, compepitiveness and more. Contact them with realtime chat and start enjoying games like never before!

## Features

- Realtime chat
  - Direct message and group chats
- Realtime notifications
  - Friend requests, messages, online status
- Wide range of player filters
- Login with email and google
- Modern and accessible UI
- Fast and easy profile setup
- Profile customization

## Installation

```
git clone https://github.com/jamktiko/Synerra
cd Synerra
npm install
```

## Configuration

You need to do a shit ton of ur own configs for this to work lmfao

### Amazon Web Services

lot of crap here

### Google login

If you want the Google login to work on your own AWS host, you need to set up your own Google API client ID.
This can easily be achieved by following the part 1 of [this tutorial](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

- Authorized JavaScript origins should look something like: `https://abcd1234.cloudfront.net`
- Authorized redirect URIs should look something like: `https://YourApp.auth.region.amazoncognito.com/oauth2/idpresponse`
