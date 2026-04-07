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
const listenerSubscriptions = new Set<{
  successSubscription: { remove(): void };
  errorSubscription: { remove(): void };
}>();

export const EmitterMessages = {
  SMS_RECEIVED: 'SMS_RECEIVED',
  SMS_ERROR: 'SMS_ERROR',
} as const;

export function listenForVerificationSms(
  callback: (error: Error | null, message: string | null) => void
) {
  const successSubscription = emitter.addListener(
    EmitterMessages.SMS_RECEIVED,
    (...args: readonly unknown[]) => {
      const message =
        typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      callback(null, message);
    }
  );
  const errorSubscription = emitter.addListener(
    EmitterMessages.SMS_ERROR,
    (...args: readonly unknown[]) => {
      const error =
        typeof args[0] === 'string'
          ? args[0]
          : String(args[0] ?? 'Unknown error');
      callback(new Error(error), null);
    }
  );
  const subscriptions = { successSubscription, errorSubscription };
  listenerSubscriptions.add(subscriptions);

  return {
    remove() {
      successSubscription.remove();
      errorSubscription.remove();
      listenerSubscriptions.delete(subscriptions);
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

export function removeVerificationListeners() {
  listenerSubscriptions.forEach(
    ({ successSubscription, errorSubscription }) => {
      successSubscription.remove();
      errorSubscription.remove();
    }
  );
  listenerSubscriptions.clear();
}

// Backward-compatible aliases for the previous public API.
export const receiveVerificationSMS = listenForVerificationSms;
export const removeAllListeners = removeVerificationListeners;

export default {
  listenForVerificationSms,
  startSmsRetriever,
  startSmsUserConsent,
  removeVerificationListeners,
  receiveVerificationSMS,
  removeAllListeners,
};
