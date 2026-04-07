package com.androidotpverificationapi;

import static android.content.Context.RECEIVER_EXPORTED;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

public class AndroidOtpVerificationApiModule extends ReactContextBaseJavaModule {
  public static final String SMS_RECEIVED = "SMS_RECEIVED";
  public static final String SMS_ERROR = "SMS_ERROR";

  private int userConsentRequestCode = 69;
  private static ReactApplicationContext reactContext;

  private final ActivityEventListener activityEventListener =
      new ActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
          handleActivityResult(requestCode, resultCode, data);
        }

        @Override
        public void onNewIntent(Intent intent) {}
      };

  private final BroadcastReceiver smsVerificationReceiver =
      new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
          if (!SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) {
            return;
          }

          Bundle extras = intent.getExtras();
          if (extras == null) {
            sendEvent(SMS_ERROR, "Unable to retrieve SMS");
            return;
          }

          Status smsRetrieverStatus = (Status) extras.get(SmsRetriever.EXTRA_STATUS);
          if (smsRetrieverStatus == null) {
            sendEvent(SMS_ERROR, "Unable to retrieve SMS");
            return;
          }

          switch (smsRetrieverStatus.getStatusCode()) {
            case CommonStatusCodes.SUCCESS:
              try {
                String message = (String) extras.get(SmsRetriever.EXTRA_SMS_MESSAGE);
                if (message != null) {
                  sendEvent(SMS_RECEIVED, message);
                } else {
                  Intent consentIntent =
                      extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT);
                  Activity currentActivity = getCurrentActivity();
                  if (currentActivity != null && consentIntent != null) {
                    currentActivity.startActivityForResult(
                        consentIntent,
                        userConsentRequestCode
                    );
                  } else {
                    sendEvent(SMS_ERROR, "Unable to retrieve SMS");
                  }
                }
              } catch (ActivityNotFoundException e) {
                sendEvent(SMS_ERROR, e.getMessage());
              }
              break;
            case CommonStatusCodes.TIMEOUT:
              sendEvent(SMS_ERROR, String.valueOf(CommonStatusCodes.TIMEOUT));
              break;
            default:
              sendEvent(SMS_ERROR, "Unable to retrieve SMS");
              break;
          }
        }
      };

  AndroidOtpVerificationApiModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
    context.addActivityEventListener(activityEventListener);

    IntentFilter intentFilter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(
          smsVerificationReceiver,
          intentFilter,
          SmsRetriever.SEND_PERMISSION,
          null,
          RECEIVER_EXPORTED
      );
    } else {
      context.registerReceiver(
          smsVerificationReceiver,
          intentFilter,
          SmsRetriever.SEND_PERMISSION,
          null
      );
    }
  }

  @NonNull
  @Override
  public String getName() {
    return "AndroidOtpVerificationApi";
  }

  @Override
  public void invalidate() {
    ReactApplicationContext context = getReactApplicationContext();
    context.removeActivityEventListener(activityEventListener);

    try {
      context.unregisterReceiver(smsVerificationReceiver);
    } catch (IllegalArgumentException ignored) {
      // Receiver may already be unregistered during teardown.
    }

    if (reactContext == context) {
      reactContext = null;
    }

    super.invalidate();
  }

  @ReactMethod
  public void startSmsRetriever(Promise promise) {
    SmsRetrieverClient client = SmsRetriever.getClient(getReactApplicationContext());
    Task<Void> task = client.startSmsRetriever();
    task.addOnSuccessListener(
        new OnSuccessListener<Void>() {
          @Override
          public void onSuccess(Void unused) {
            promise.resolve(true);
          }
        });
    task.addOnFailureListener(
        new OnFailureListener() {
          @Override
          public void onFailure(@NonNull Exception e) {
            promise.reject("SMS_RETRIEVER_ERROR", e);
          }
        });
  }

  @ReactMethod
  public void startSmsUserConsent(String senderPhoneNumber, int requestCode, Promise promise) {
    userConsentRequestCode = requestCode;

    SmsRetrieverClient client = SmsRetriever.getClient(getReactApplicationContext());
    Task<Void> task =
        senderPhoneNumber == null
            ? client.startSmsUserConsent(null)
            : client.startSmsUserConsent(senderPhoneNumber);

    task.addOnSuccessListener(
        new OnSuccessListener<Void>() {
          @Override
          public void onSuccess(Void unused) {
            promise.resolve(true);
          }
        });
    task.addOnFailureListener(
        new OnFailureListener() {
          @Override
          public void onFailure(@NonNull Exception e) {
            promise.reject("SMS_USER_CONSENT_ERROR", e);
          }
        });
  }

  private void handleActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode != userConsentRequestCode) {
      return;
    }

    if (resultCode == Activity.RESULT_OK && data != null) {
      String message = data.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE);
      if (message != null) {
        sendEvent(SMS_RECEIVED, message);
        return;
      }
    }

    sendEvent(SMS_ERROR, "Unable to retrieve SMS");
  }

  public static void sendEvent(String eventName, Object data) {
    if (reactContext == null) {
      return;
    }

    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, data);
  }
}
