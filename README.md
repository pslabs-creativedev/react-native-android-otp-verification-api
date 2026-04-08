# react-native-android-otp-verification-api

React Native Android module for OTP autofill using the SMS User Consent API.

This package exposes Android OTP APIs to React Native and is intended for apps
that need:

- SMS User Consent flow
- SMS Retriever flow
- JS listeners for `SMS_RECEIVED` and `SMS_ERROR`

It is especially useful when your OTP flow cannot rely only on app-hash based
SMS Retriever formatting.

## Installation

```sh
npm install react-native-android-otp-verification-api
```

Then rebuild your Android app.

```sh
npx react-native run-android
```

## Usage

```tsx
import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import {
  isSupported,
  listenForOtp,
  startRetriever,
  startUserConsent,
} from 'react-native-android-otp-verification-api';

export default function Example() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const subscription = listenForOtp((err, sms) => {
      if (err) {
        setError(err.message);
        return;
      }

      if (!sms) {
        return;
      }

      setMessage(sms);
      const match = /\b(\d{6})\b/.exec(sms);
      setOtp(match ? match[1] : '');
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  return (
    <View>
      <Button
        title="Start User Consent"
        onPress={() => startUserConsent()}
        disabled={!isSupported()}
      />
      <Button
        title="Start Retriever"
        onPress={() => startRetriever()}
        disabled={!isSupported()}
      />
      <Text>OTP: {otp}</Text>
      <Text>Message: {message}</Text>
      <Text>Error: {error}</Text>
    </View>
  );
}
```

## API

- `isSupported()`
  - returns `true` on Android and `false` on iOS
- `listenForOtp(callback)`
  - subscribes to `SMS_RECEIVED` and `SMS_ERROR`
- `startRetriever()`
  - starts Android SMS Retriever
- `startUserConsent(options?)`
  - starts Android SMS User Consent flow with an object-based API
- `removeOtpListeners()`
  - removes all active SMS listeners created by this library

In most apps, prefer the `subscription.remove()` returned by
`listenForOtp()` over global listener cleanup.

## Notes

- Android only for native OTP functionality
- Safe to import on iOS, but OTP methods are no-ops there
- On iOS, `isSupported()` returns `false`
- On iOS, `startRetriever()` and `startUserConsent()` resolve to `false`
- On iOS, the listener APIs return a removable no-op subscription
- This package does not support iOS OTP retrieval
- SMS User Consent can work without app-hash formatting
- SMS Retriever requires the OTP SMS to include the app hash
- If you only call `startSmsRetriever()`, your backend SMS must follow Google's
  SMS Retriever format

## Choosing a Flow

- Use `startUserConsent()` when your current OTP SMS text should remain
  unchanged and you want the user to approve the message read.
- Use `startRetriever()` when your backend can include the app hash in the
  SMS and you want silent OTP capture.

## Example OTP Regex

For a 6-digit OTP:

```js
const match = /\b(\d{6})\b/.exec(message);
const otp = match ? match[1] : null;
```

## Android Dependency

This package uses:

```gradle
implementation "com.google.android.gms:play-services-auth-api-phone:18.3.0"
```

## Publishing Checklist

- update repository URL and author if needed
- run the Android example app
- verify User Consent flow on a real device
- verify Retriever flow separately if you support hashed SMS
- publish with a proper version tag


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
