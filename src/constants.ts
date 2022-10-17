import { registerEnumType } from "type-graphql";

export const COOKIE_NAME = "cb-cspace-cookie";
export const __prod__ = process.env.NODE_ENV === "production";

export enum ROOM_STATUS {
  Owned = "Owned",
  Available = "Available",
  NotAvailable = "Not Available",
}

export enum PAYMENT_STATUS {
  Paid = "Paid",
  Unpaid = "Unpaid",
  Canceled = "Canceled",
}

export enum LOCATION_RESERVATION_STATUS {
  Draft = "Draft",
  Published = "Published",
}

export enum ORDER_BY {
  ASC = "ASC",
  DESC = "DESC",
}

export enum PROMOTION_TYPE {
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
registerEnumType(PROMOTION_TYPE, {
  name: "PROMOTION_TYPE",
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
