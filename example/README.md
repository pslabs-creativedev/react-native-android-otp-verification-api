# Example App

This example app is for testing `react-native-android-otp-verification-api` on Android.

## Run

From the library root:

```sh
yarn
yarn example start
```

In another terminal:

```sh
yarn example android
```

## What to test

- `Start User Consent`
- `Start Retriever`
- OTP extraction from a real SMS
- listener cleanup when reloading the app

## Important

- test on a real Android device
- SMS User Consent does not require app-hash formatting
- SMS Retriever does require the app hash in the SMS
