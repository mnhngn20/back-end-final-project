import { registerEnumType } from "type-graphql";

export const COOKIE_NAME = "cb-cspace-cookie";
export const __prod__ = process.env.NODE_ENV === "production";

export enum RESERVATION_STATUS {
  Paid = "Paid",
  Unpaid = "Unpaid",
  Canceled = "Canceled",
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
  Employee = "Employee",
  Customer = "Customer",
}

registerEnumType(ORDER_BY, {
  name: "ORDER_BY",
});
registerEnumType(USER_ROLE, {
  name: "USER_ROLE",
});
registerEnumType(PROMOTION_TYPE, {
  name: "PROMOTION_TYPE",
});
registerEnumType(RESERVATION_STATUS, {
  name: "RESERVATION_STATUS",
});
registerEnumType(PAYMENT_METHOD, {
  name: "PAYMENT_METHOD",
});
