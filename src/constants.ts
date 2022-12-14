import { registerEnumType } from "type-graphql";

export const COOKIE_NAME = "cb-cspace-cookie";
export const __prod__ = process.env.NODE_ENV === "production";
export enum PLAT_FORM {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin",
  Customer = "Customer",
}

export enum ROOM_STATUS {
  Owned = "Owned",
  Available = "Available",
  NotAvailable = "Not Available",
}

export enum PAYMENT_STATUS {
  Paid = "Paid",
  Unpaid = "Unpaid",
  Canceled = "Canceled",
  MissingLivingPrice = "Missing Living Price",
}

export enum INCIDENT_STATUS {
  ToDo = "To Do",
  InProgress = "In Progress",
  Cancel = "Cancel",
  Done = "Done",
  Overdue = "Overdue",
}

export enum NOTIFICATION_TYPE {
  Payment = "Payment",
  Announcement = "Announcement",
  Incident = "Incident",
  Other = "Other",
  Reservation = "Reservation",
}

export enum INCIDENT_PRIORITY {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent",
}

export enum LOCATION_RESERVATION_STATUS {
  Draft = "Draft",
  Published = "Published",
  Completed = "Completed",
}

export enum ORDER_BY {
  ASC = "ASC",
  DESC = "DESC",
}

export enum DISCOUNT_TYPE {
  PercentageDiscount = "PercentageDiscount",
  FixedCashDiscount = "FixedCashDiscount",
}

export enum PAYMENT_METHOD {
  Cash = "Cash",
  Paypal = "Paypal",
}

export enum USER_ROLE {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin",
  Customer = "Customer",
}

registerEnumType(ORDER_BY, {
  name: "ORDER_BY",
});
registerEnumType(NOTIFICATION_TYPE, {
  name: "NOTIFICATION_TYPE",
});
registerEnumType(INCIDENT_STATUS, {
  name: "INCIDENT_STATUS",
});
registerEnumType(INCIDENT_PRIORITY, {
  name: "INCIDENT_PRIORITY",
});
registerEnumType(ROOM_STATUS, {
  name: "ROOM_STATUS",
});
registerEnumType(PAYMENT_STATUS, {
  name: "PAYMENT_STATUS",
});
registerEnumType(LOCATION_RESERVATION_STATUS, {
  name: "LOCATION_RESERVATION_STATUS",
});
registerEnumType(USER_ROLE, {
  name: "USER_ROLE",
});
registerEnumType(DISCOUNT_TYPE, {
  name: "DISCOUNT_TYPE",
});
registerEnumType(PAYMENT_STATUS, {
  name: "RESERVATION_STATUS",
});
registerEnumType(PAYMENT_METHOD, {
  name: "PAYMENT_METHOD",
});

export const PLATFORM = [
  USER_ROLE.Admin,
  USER_ROLE.Customer,
  USER_ROLE.SuperAdmin,
];
