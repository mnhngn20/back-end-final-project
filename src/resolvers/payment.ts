import { Payment } from "./../entities/Payment";
import { Location } from "./../entities/Location";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import {
  GetPaymentsInput,
  PaymentListResponse,
  PaymentResponse,
  UpdatePaymentStatusInput,
  UpsertPaymentInput,
} from "../types/payment";
import { User, Room, LocationReservation } from "../entities";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { DISCOUNT_TYPE, PAYMENT_STATUS, ROOM_STATUS } from "../constants";
import { In } from "typeorm";

@Resolver()
export class PaymentResolver {
  @Query((_returns) => PaymentResponse)
  @UseMiddleware(authMiddleware)
  async getPayment(@Arg("id") id: number): Promise<PaymentResponse> {
    try {
      const existingPayment = await Payment.findOne({
        where: { id },
        relations: ["location", "users", "room", "locationReservation"],
      });

      if (!existingPayment) throw new Error("Payment not found");

      return {
        message: "Get payment successfully",
        payment: existingPayment,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => PaymentListResponse)
  @UseMiddleware(authMiddleware)
  async getPayments(
    @Arg("input")
    {
      limit,
      page,
      orderBy,
      locationId,
      locationReservationId,
      roomId,
      status,
      userIds,
      floor,
    }: GetPaymentsInput
  ): Promise<PaymentListResponse> {
    try {
      const builder = Payment.createQueryBuilder("payment")
        .leftJoinAndSelect("payment.users", "user")
        .leftJoinAndSelect("payment.room", "room")
        .leftJoinAndSelect("payment.location", "location")
        .leftJoinAndSelect("payment.locationReservation", "locationReservation")
        .where(`"payment"."id" IS NOT NULL`)
        .orderBy("payment.createdAt", orderBy);

      if (floor) {
        builder.andWhere(`"room"."floor" = :floor`, {
          floor,
        });
      }

      if (userIds) {
        builder.andWhere(`"user"."id" IN (:...userIds)`, {
          userIds,
        });
      }
      if (locationId) {
        builder.andWhere(`"payment"."locationId" = :locationId`, {
          locationId,
        });
      }
      if (locationReservationId) {
        builder.andWhere(
          `"payment"."locationReservationId" = :locationReservationId`,
          {
            locationReservationId,
          }
        );
      }
      if (roomId) {
        builder.andWhere(`"payment"."roomId" = :roomId`, {
          roomId,
        });
      }
      if (status) {
        builder.andWhere(`"payment"."status" = :status`, {
          status,
        });
      }

      const [data, total] = await builder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get payments successfully",
        items: data,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => PaymentResponse)
  @UseMiddleware(authMiddleware)
  async updatePaymentStatus(
    @Arg("input") { id, status }: UpdatePaymentStatusInput
  ): Promise<PaymentResponse> {
    try {
      const existingPayment = await Payment.findOne({
        where: { id },
        relations: ["location", "users", "room", "locationReservation"],
      });

      if (!existingPayment) throw new Error("Payment Not Found");

      existingPayment.status = status;
      return {
        message: "Update payment Status successfully",
        payment: await existingPayment.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => PaymentResponse)
  @UseMiddleware(authMiddleware)
  async manuallyPay(
    @Arg("id")
    id: number
  ): Promise<PaymentResponse> {
    try {
      const existingPayment = await Payment.findOne({ where: { id } });

      if (!existingPayment) {
        throw new Error("Payment not found!");
      }

      const existingLocationReservation = await LocationReservation.findOne({
        where: {
          id: existingPayment.locationReservationId,
        },
      });

      if (!existingLocationReservation) {
        throw new Error("Location Reservation Not Found!");
      }

      existingLocationReservation.totalReceivedPrice =
        (existingLocationReservation?.totalReceivedPrice ?? 0) +
        (existingPayment.totalPrice ?? 0);

      await existingLocationReservation.save();

      existingPayment.status = PAYMENT_STATUS.Paid;

      return {
        message: "Successfully paid",
        payment: await existingPayment.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => PaymentResponse)
  @UseMiddleware(authMiddleware)
  async upsertPayment(
    @Arg("input")
    {
      id,
      locationId,
      roomId,
      locationReservationId,
      discount,
      discountType,
      electricCounter,
      waterPrice,
      extraFee,
      prePaidFee,
      userIds,
    }: UpsertPaymentInput
  ): Promise<PaymentResponse> {
    const existingLocation = await Location.findOne({
      where: { id: locationId },
    });

    if (!existingLocation) {
      throw new Error("Location not found!");
    }

    const existingRoom = await Room.findOne({
      where: {
        id: roomId,
      },
    });

    if (!existingRoom) {
      throw new Error("Room not found");
    }

    if (existingRoom.status !== ROOM_STATUS.Owned) {
      throw new Error("Room must have an owner to created payment");
    }

    const existingLocationReservation = await LocationReservation.findOne({
      where: { id: locationReservationId },
      relations: ["payments"],
    });

    if (!existingLocationReservation) {
      throw new Error("Location reservation not found!");
    }

    if (existingLocationReservation?.locationId !== locationId) {
      throw new Error(PermissionDeniedError);
    }

    try {
      if (id) {
        // UPDATE SECTION
        const existingPayment = await Payment.findOne({ where: { id } });
        if (!existingPayment) throw new Error("Payment Not Found");

        Payment.merge(existingPayment, {
          locationId,
          roomId,
          locationReservationId,
        });

        const roomUsers = await User.find({
          where: { roomId },
        });

        existingPayment.users = roomUsers;

        let calculatedPaymentPrice = existingRoom.basePrice;
        if (waterPrice) {
          calculatedPaymentPrice += waterPrice;
          existingPayment.waterPrice = waterPrice;
        }
        if (electricCounter) {
          calculatedPaymentPrice +=
            electricCounter * (existingLocation.electricCounterPrice ?? 0);
          existingPayment.electricCounter = electricCounter;
        }
        if (discountType) {
          existingPayment.discountType = discountType;
        }

        if (discount) {
          if (
            existingPayment.discountType === DISCOUNT_TYPE.FixedCashDiscount
          ) {
            calculatedPaymentPrice -= discount;
          }
          if (
            existingPayment.discountType === DISCOUNT_TYPE.PercentageDiscount
          ) {
            calculatedPaymentPrice -= (calculatedPaymentPrice * discount) / 100;
          }
          existingPayment.discount = discount;
        }

        if (extraFee) {
          existingPayment.extraFee = extraFee;
          calculatedPaymentPrice += extraFee;
        }

        if (prePaidFee) {
          existingPayment.prePaidFee = prePaidFee;
          calculatedPaymentPrice -= prePaidFee;
        }
        if (
          !!existingPayment.discount ||
          !!existingPayment.waterPrice ||
          !!existingPayment.electricCounter ||
          existingPayment.extraFee ||
          existingPayment.prePaidFee
        ) {
          existingPayment.status = PAYMENT_STATUS.Unpaid;
        }

        if (userIds) {
          const existingUsers = await User.find({
            where: {
              id: In(userIds),
            },
          });

          existingPayment.users = existingUsers;
        }

        existingPayment.totalPrice = calculatedPaymentPrice;

        await existingPayment.save();
        // Update total calculated price
        let totalCalculatedPrice = 0;
        existingLocationReservation.payments.forEach((payment) => {
          if (payment?.id === existingPayment?.id) {
            totalCalculatedPrice +=
              (existingPayment.totalPrice ?? 0) +
              (existingPayment.prePaidFee ?? 0);
          } else {
            totalCalculatedPrice +=
              (payment.totalPrice ?? 0) + (payment.prePaidFee ?? 0);
          }
        });

        existingLocationReservation.totalCalculatedPrice = totalCalculatedPrice;
        await existingLocationReservation.save();

        return {
          message: "Update payment successfully",
          payment: await existingPayment.save(),
        };
      } else {
        // CREATE SECTION
        const existingPaymentForLocationReservation = await Payment.findOne({
          where: {
            locationReservationId,
            roomId,
          },
        });

        if (existingPaymentForLocationReservation) {
          throw new Error(
            "Payment for this room in this month has been created"
          );
        }

        const newPayment = await Payment.create({
          totalPrice: existingRoom?.basePrice,
          roomId,
          locationReservationId,
          locationId,
          status: PAYMENT_STATUS.MissingLivingPrice,
        });

        const roomUsers = await User.find({
          where: { roomId },
        });

        newPayment.users = roomUsers;

        return {
          message: "Create payment successfully",
          payment: await newPayment.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
