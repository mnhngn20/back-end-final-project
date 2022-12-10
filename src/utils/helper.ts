import { Location } from "./../entities/Location";
import { UpsertPaymentInput } from "./../types/payment/args/UpsertPaymentInput";
import { Payment, IncidentCategory, Room } from "./../entities";
import { DISCOUNT_TYPE, PAYMENT_STATUS } from "../constants";

export const createEquipmentReportIncidentCategory = async () => {
  try {
    const existingEquipment = await IncidentCategory.findOne({
      where: {
        name: "Equipment Report",
      },
    });
    if (!existingEquipment) {
      return await IncidentCategory.save(
        IncidentCategory.create({
          name: "Equipment Report",
          description: "Equipment Report",
          isActive: true,
        })
      );
    } else return existingEquipment;
  } catch (error) {
    throw new Error(error);
  }
};

export const calculateAndUpdatePaymentPrice = async (
  payment: Payment,
  electricCounterPrice: number,
  {
    waterPrice,
    electricCounter,
    discountType,
    discount,
    extraFee,
    prePaidFee,
  }: Partial<UpsertPaymentInput>
) => {
  try {
    const existingRoom = await Room.findOne({
      where: {
        id: payment.roomId,
      },
    });
    if (!existingRoom) {
      throw new Error("Room Not Found");
    }

    let calculatedPaymentPrice = existingRoom.basePrice;
    if (waterPrice !== undefined) {
      calculatedPaymentPrice += waterPrice;
      payment.waterPrice = waterPrice;
    }
    if (electricCounter !== undefined) {
      calculatedPaymentPrice += electricCounter * (electricCounterPrice ?? 0);
      payment.electricCounter = electricCounter;
    }
    if (discountType) {
      payment.discountType = discountType;
    }

    if (discount !== undefined) {
      if (payment.discountType === DISCOUNT_TYPE.FixedCashDiscount) {
        calculatedPaymentPrice -= discount;
      }
      if (payment.discountType === DISCOUNT_TYPE.PercentageDiscount) {
        calculatedPaymentPrice -= (calculatedPaymentPrice * discount) / 100;
      }
      payment.discount = discount;
    }

    if (extraFee !== undefined) {
      payment.extraFee = extraFee;
      calculatedPaymentPrice += extraFee;
    }

    if (prePaidFee !== undefined) {
      payment.prePaidFee = prePaidFee;
      calculatedPaymentPrice -= prePaidFee;
    }
    if (
      !!payment.discount ||
      !!payment.waterPrice ||
      !!payment.electricCounter ||
      !!payment.extraFee ||
      !!payment.prePaidFee
    ) {
      payment.status = PAYMENT_STATUS.Unpaid;
    }

    payment.totalPrice = calculatedPaymentPrice;

    await payment.save();

    return calculatedPaymentPrice;
  } catch (error) {
    throw new Error(error);
  }
};

export const updateLocationTotalRevenue = async (location: Location) => {
  try {
    let totalRevenue = 0;
    location.locationReservations.forEach(async (reservation) => {
      totalRevenue += reservation.totalReceivedPrice ?? 0;
    });

    location.totalRevenue = totalRevenue;

    await location.save();

    return totalRevenue;
  } catch (error) {
    throw new Error(error);
  }
};
