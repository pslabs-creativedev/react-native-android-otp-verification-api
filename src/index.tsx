import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type VerificationSmsCallback = (
  error: Error | null,
  message: string | null
) => void;

export type VerificationListenerSubscription = {
  remove(): void;
};

export type StartUserConsentOptions = {
  senderPhoneNumber?: string | null;
  requestCode?: number;
};

const LINKING_ERROR =
  `The package 'react-native-android-otp-verification-api' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n';

const NativeOtpModule =
  Platform.OS === 'android'
    ? NativeModules.AndroidOtpVerificationApi
      ? NativeModules.AndroidOtpVerificationApi
      : new Proxy(
          {},
          {
            get() {
              throw new Error(LINKING_ERROR);
            },
          }
        )
    : null;

const emitter = NativeOtpModule
  ? new NativeEventEmitter(NativeOtpModule)
  : null;
const listenerSubscriptions = new Set<{
  successSubscription: { remove(): void };
  errorSubscription: { remove(): void };
}>();

export const EmitterMessages = {
  SMS_RECEIVED: 'SMS_RECEIVED',
  SMS_ERROR: 'SMS_ERROR',
} as const;

export function isSupported(): boolean {
  return Platform.OS === 'android';
}

export function listenForOtp(
  callback: VerificationSmsCallback
): VerificationListenerSubscription {
  if (!emitter) {
    return {
      remove() {},
    };
  }

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

export function startRetriever(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(false);
  }

  return NativeOtpModule.startSmsRetriever();
}

function startSmsUserConsentNative(
  senderPhoneNumber: string | null = null,
  requestCode = 69
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(false);
  }

  return NativeOtpModule.startSmsUserConsent(senderPhoneNumber, requestCode);
}

export function startUserConsent(
  options: StartUserConsentOptions = {}
): Promise<boolean> {
  const { senderPhoneNumber = null, requestCode = 69 } = options;

  return startSmsUserConsentNative(senderPhoneNumber, requestCode);
}

export function removeOtpListeners() {
  if (!emitter) {
    return;
  }

  listenerSubscriptions.forEach(
    ({ successSubscription, errorSubscription }) => {
      successSubscription.remove();
      errorSubscription.remove();
    }
  );
  listenerSubscriptions.clear();
}

export default {
  isSupported,
  listenForOtp,
  startRetriever,
  startUserConsent,
  removeOtpListeners,
};
