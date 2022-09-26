import { initializeApp, App } from "firebase-admin/app";
import { MessagingPayload } from "firebase-admin/lib/messaging/messaging-api";
import { getMessaging } from "firebase-admin/messaging";
import { credential } from "firebase-admin";

export default class NotificationHelper {
  static _defaultMessageOption = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };
  static app: App;
  static init = () => {
    NotificationHelper.app = initializeApp({
      credential: credential.cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_KEY?.replace(/\\n/g, "\n"),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }),
      serviceAccountId: process.env.FIREBASE_CLIENT_ID,
    });
  };

  static sendToDevice = (token: string, message: MessagingPayload) => {
    try {
      getMessaging(NotificationHelper.app).sendToDevice(
        token,
        message,
        NotificationHelper._defaultMessageOption
      );
    } catch (err) {
      console.log(err);
    }
  };

  static sendToMultiDevices = (tokens: string[], message: MessagingPayload) => {
    try {
      getMessaging(NotificationHelper.app).sendToDevice(
        tokens,
        message,
        NotificationHelper._defaultMessageOption
      );
    } catch (err) {
      console.log(err);
    }
  };
}
