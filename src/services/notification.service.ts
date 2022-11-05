import { getMessaging } from "firebase-admin/messaging";
import { Notification, User } from "../entities";
import admin from "firebase-admin";

import serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export async function createAndPushNotification(
  notificationInput: Partial<Notification>,
  users: User[]
) {
  const newNotification = (await Notification.save(
    Notification.create(notificationInput)
  )) as Notification;

  const message = {
    data: {
      content: notificationInput.content ?? "",
      title: notificationInput.title ?? "",
      type: notificationInput.type ?? "",
      dataId: notificationInput.dataId?.toString() ?? "",
      userId: notificationInput.userId?.toString() ?? "",
      createdAt: newNotification?.createdAt?.toString() ?? "",
    },
    tokens: users
      .filter((user) => !!user.firebaseToken)
      .map((user) => user.firebaseToken) as string[],
  };

  const repo = await getMessaging().sendMulticast(message);

  console.log(repo?.responses);

  return newNotification;
}
