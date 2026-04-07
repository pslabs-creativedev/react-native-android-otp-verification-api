import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-android-otp-verification-api' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n';

const NativeOtpModule = NativeModules.AndroidOtpVerificationApi
  ? NativeModules.AndroidOtpVerificationApi
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const emitter = new NativeEventEmitter(NativeOtpModule);

export const EmitterMessages = {
  SMS_RECEIVED: 'SMS_RECEIVED',
  SMS_ERROR: 'SMS_ERROR',
} as const;

export function receiveVerificationSMS(
  callback: (error: Error | null, message: string | null) => void
) {
  const successSubscription = emitter.addListener(
    EmitterMessages.SMS_RECEIVED,
    (message: string) => callback(null, message)
  );
  const errorSubscription = emitter.addListener(
    EmitterMessages.SMS_ERROR,
    (error: string) => callback(new Error(error), null)
  );

  return {
    remove() {
      successSubscription.remove();
      errorSubscription.remove();
    },
  };
}

export function startSmsRetriever(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(false);
  }

  return NativeOtpModule.startSmsRetriever();
}

export function startSmsUserConsent(
  senderPhoneNumber: string | null = null,
  userConsentRequestCode = 69
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(false);
  }

  return NativeOtpModule.startSmsUserConsent(
    senderPhoneNumber,
    userConsentRequestCode
  );
}

export function removeAllListeners() {
  emitter.removeAllListeners(EmitterMessages.SMS_RECEIVED);
  emitter.removeAllListeners(EmitterMessages.SMS_ERROR);
}

export default {
  receiveVerificationSMS,
  startSmsRetriever,
  startSmsUserConsent,
  removeAllListeners,
};
