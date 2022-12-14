import dayjs from "dayjs";
import { updateLocationReservationPrice } from "./../utils/common/locationReservation";
import {
  calculateAndUpdatePaymentPrice,
  updateLocationTotalRevenue,
} from "./../utils/helper";
import { Payment } from "./../entities/Payment";
import { Location } from "./../entities/Location";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import {
  GetPaymentsInput,
  PaymentListResponse,
  PaymentResponse,
  UpdatePaymentsInput,
  UpdatePaymentStatusInput,
  UpsertPaymentInput,
} from "../types/payment";
import { User, Room, LocationReservation, Transaction } from "../entities";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import {
  LOCATION_RESERVATION_STATUS,
  PAYMENT_STATUS,
  ROOM_STATUS,
  USER_ROLE,
} from "../constants";
import { In } from "typeorm";
import { Context } from "../types/Context";

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
    }: GetPaymentsInput,
    @Ctx() { user: currentUser }: Context
  ): Promise<PaymentListResponse> {
    try {
      const builder = Payment.createQueryBuilder("payment")
        .leftJoinAndSelect("payment.users", "user")
        .leftJoinAndSelect("payment.room", "room")
        .leftJoinAndSelect("payment.location", "location")
        .leftJoinAndSelect("payment.locationReservation", "locationReservation")
        .where(`"payment"."id" IS NOT NULL`)
        .orderBy("payment.updatedAt", orderBy);

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

      if (currentUser?.role === USER_ROLE.Customer) {
        builder.andWhere(`"locationReservation"."status" != :status`, {
          status: LOCATION_RESERVATION_STATUS.Draft,
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

  @Mutation((_returns) => String)
  @UseMiddleware(authMiddleware)
  async updatePayments(
    @Arg("input")
    { locationReservationId, ...rest }: UpdatePaymentsInput
  ): Promise<string> {
    try {
      const existingLocationReservation = await LocationReservation.findOne({
        where: {
          id: locationReservationId,
        },
        relations: ["location"],
      });

      if (!existingLocationReservation) {
        throw new Error("Location Reservation Not Found!");
      }

      const locationReservationPayments = await Payment.find({
        where: {
          locationReservationId,
        },
      });

      locationReservationPayments.forEach(async (payment) => {
        await calculateAndUpdatePaymentPrice(
          payment,
          existingLocationReservation.location.electricCounterPrice ?? 0,
          { ...rest },
          true
        );
      });

      await updateLocationReservationPrice(existingLocationReservation);

      return "Update payments successfully!";
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => PaymentResponse)
  @UseMiddleware(authMiddleware)
  async manuallyPay(
    @Arg("paymentId")
    id: number,
    @Arg("payerId")
    payerId: number
  ): Promise<PaymentResponse> {
    try {
      const existingPayment = await Payment.findOne({ where: { id } });
      const existingPayer = await User.findOne({
        where: {
          id: payerId,
        },
      });

      if (!existingPayment) {
        throw new Error("Payment not found!");
      }
      if (!existingPayer) {
        throw new Error("User not found!");
      }

      const existingLocationReservation = await LocationReservation.findOne({
        where: {
          id: existingPayment.locationReservationId,
        },
      });

      if (!existingLocationReservation) {
        throw new Error("Location Reservation Not Found!");
      }

      updateLocationReservationPrice(existingLocationReservation);

      existingPayment.status = PAYMENT_STATUS.Paid;

      const existingLocation = await Location.findOne({
        where: {
          id: existingLocationReservation.locationId,
        },
        relations: ["locationReservations"],
      });
      if (!existingLocation) {
        throw new Error("Location not found");
      }

      await updateLocationTotalRevenue(existingLocation);

      await Transaction.create({
        amount: existingPayment.totalPrice ?? 0,
        userId: payerId,
        description: `Payment from Admin for ${dayjs(
          existingLocationReservation.startDate
        ).format("MMMM YYYY")} Reservation`,
      }).save();

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
        const existingPayment = await Payment.findOne({
          where: { id },
          relations: ["room"],
        });
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

        await calculateAndUpdatePaymentPrice(
          existingPayment,
          existingLocation.electricCounterPrice ?? 0,
          {
            discount,
            discountType,
            electricCounter,
            extraFee,
            prePaidFee,
            waterPrice,
          }
        );

        if (userIds) {
          const existingUsers = await User.find({
            where: {
              id: In(userIds),
            },
          });

          existingPayment.users = existingUsers;
        }

        await existingPayment.save();

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
