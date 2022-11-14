import { LocationReservation } from "./../../entities/LocationReservation";

export const updateLocationReservationTotalCalculatedPrice = async (
  existingLocationReservation: LocationReservation
) => {
  let totalCalculatedPrice = 0;
  existingLocationReservation.payments?.forEach((payment) => {
    totalCalculatedPrice +=
      (payment.totalPrice ?? 0) + (payment.prePaidFee ?? 0);
  });
  existingLocationReservation.totalCalculatedPrice = totalCalculatedPrice;

  await existingLocationReservation.save();

  return totalCalculatedPrice;
};
