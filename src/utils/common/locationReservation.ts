import { PAYMENT_STATUS } from "../../constants";
import { LocationReservation } from "./../../entities/LocationReservation";

export const updateLocationReservationPrice = async (
  existingLocationReservation: LocationReservation
) => {
  let totalCalculatedPrice = 0;
  let totalReceivedPrice = 0;
  existingLocationReservation.payments?.forEach((payment) => {
    totalCalculatedPrice +=
      (payment.totalPrice ?? 0) + (payment.prePaidFee ?? 0);
    totalReceivedPrice += payment?.prePaidFee ?? 0;
    if (payment.status === PAYMENT_STATUS.Paid) {
      totalReceivedPrice += payment.totalPrice ?? 0;
    }
  });
  existingLocationReservation.totalCalculatedPrice = totalCalculatedPrice;
  existingLocationReservation.totalReceivedPrice = totalReceivedPrice;
  await existingLocationReservation.save();

  return totalCalculatedPrice;
};
