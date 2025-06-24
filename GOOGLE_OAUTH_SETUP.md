# Google OAuth Setup Guide

## Overview
This application now supports Google OAuth for user authentication, allowing users to sign in and register using their Google accounts.

## Required Environment Variables

Add the following to your `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

## Setting up Google OAuth

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Web application" as the application type

4. **Configure Authorized Origins**
   - For development: 
     - `http://localhost:5173` (your current Vite dev server port)
     - `http://127.0.0.1:5173` (alternative localhost format)
   - For production: 
     - `https://aidecktutor.com`
     - `https://www.aidecktutor.com` (if you use www subdomain)

5. **Configure Authorized Redirect URIs**
   - For development:
     - `http://localhost:5173` (for @react-oauth/google)
     - `http://127.0.0.1:5173` (alternative localhost format)
   - For production:
     - `https://aidecktutor.com`
     - `https://www.aidecktutor.com` (if you use www subdomain)
   
   **Important**: The @react-oauth/google library uses the origin URL as the redirect URI, not a specific callback path.

6. **Copy Client ID**
   - Copy the generated Client ID
   - Add it to your `.env` file as `VITE_GOOGLE_CLIENT_ID`

## Features Implemented

- **Google Login**: Users can sign in with their Google account
- **Google Registration**: New users can create accounts using Google
- **Automatic Account Creation**: If a Google user doesn't exist, an account is automatically created
- **Seamless Integration**: Google-authenticated users are treated the same as regular users

## Authentication Flow Changes

- **Deck Builder**: Now accessible without login, but requires authentication to save decks
- **AI Tools**: Accessible without login, but requires authentication to save decks
- **Commander AI**: Accessible without login, but requires authentication to save commanders as decks
- **Tutor AI**: Accessible without login, but requires authentication to add cards to saved decks

## Troubleshooting Common Issues

### "redirect_uri_mismatch" Error
This error occurs when the redirect URI in your Google Cloud Console doesn't match what your application is using.

**Solution:**
1. Check your current dev server URL (shown in terminal when you run `npm run dev`)
2. In Google Cloud Console > APIs & Services > Credentials > Your OAuth Client ID:
   - Add both `http://localhost:5173` AND `http://127.0.0.1:5173` to **Authorized JavaScript origins**
   - Add both `http://localhost:5173` AND `http://127.0.0.1:5173` to **Authorized redirect URIs**
   - For production, also add `https://aidecktutor.com` and `https://www.aidecktutor.com` to both sections
3. Save the changes and try again

### Environment Variable Issues
Make sure you have a `.env` or `.env.local` file in your project root with:
```
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

## User Experience

- Users can test all tools without creating an account
- When they try to save something, they're prompted to log in with a user-friendly message
- Google OAuth provides a quick and secure way to create accounts
- Existing email/password authentication is still supported 