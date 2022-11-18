import { updateLocationReservationTotalCalculatedPrice } from "./../utils/common/locationReservation";
import { Payment } from "./../entities/Payment";
import { Room } from "./../entities/Room";
import { User } from "./../entities/User";
import { LocationReservation } from "./../entities/LocationReservation";
import { Location } from "./../entities/Location";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import {
  GetLocationReservationsInput,
  LocationReservationListResponse,
  LocationReservationResponse,
  UpsertLocationReservationInput,
  ChangeLocationReservationStatusInput,
} from "../types/locationReservation";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import dayjs from "dayjs";
import {
  LOCATION_RESERVATION_STATUS,
  NOTIFICATION_TYPE,
  PAYMENT_STATUS,
  ROOM_STATUS,
} from "../constants";
import { createAndPushNotification } from "../services/notification.service";

@Resolver()
export class LocationReservationResolver {
  @Query((_returns) => LocationReservationResponse)
  async getLocationReservation(
    @Arg("id") id: number
  ): Promise<LocationReservationResponse> {
    try {
      const existingLocationReservation = await LocationReservation.findOne({
        where: { id },
        relations: ["location", "createdBy", "payments"],
      });

      if (!existingLocationReservation)
        throw new Error("Location reservation not found");

      //Update Location Reservation total calculated price
      const totalCalulatedPrice =
        await updateLocationReservationTotalCalculatedPrice(
          existingLocationReservation
        );
      if (
        totalCalulatedPrice ===
          existingLocationReservation?.totalReceivedPrice &&
        existingLocationReservation.status ===
          LOCATION_RESERVATION_STATUS.Published
      ) {
        existingLocationReservation.status =
          LOCATION_RESERVATION_STATUS.Completed;
        await existingLocationReservation.save();
      }

      return {
        message: "Get location reservation successfully!",
        locationReservation: await existingLocationReservation.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => LocationReservationListResponse)
  async getLocationReservations(
    @Arg("input")
    {
      limit,
      page,
      orderBy,
      createdById,
      fromDate,
      toDate,
      locationId,
      status,
    }: GetLocationReservationsInput
  ): Promise<LocationReservationListResponse> {
    try {
      let options = {
        ...(createdById && { createdById }),
        ...(locationId && { locationId }),
        ...(fromDate && { startDate: MoreThanOrEqual(fromDate) }),
        ...(toDate && { startDate: LessThanOrEqual(toDate) }),
        ...(status && { status }),
      };

      const [result, total] = await LocationReservation.findAndCount({
        order: { updatedAt: orderBy },
        take: limit,
        where: options,
        skip: (page - 1) * limit,
        relations: ["location", "createdBy", "payments"],
      });

      await Promise.all(
        result?.map(async (locationReservation) => {
          const totalCalulatedPrice =
            await updateLocationReservationTotalCalculatedPrice(
              locationReservation
            );
          if (
            totalCalulatedPrice === locationReservation?.totalReceivedPrice &&
            locationReservation.status === LOCATION_RESERVATION_STATUS.Published
          ) {
            locationReservation.status = LOCATION_RESERVATION_STATUS.Completed;
            await locationReservation.save();
          }
        })
      );

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get location reservations successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => LocationReservationResponse)
  @UseMiddleware(authMiddleware)
  async changeLocationReservationStatus(
    @Arg("input")
    { locationReservationId, status }: ChangeLocationReservationStatusInput
  ): Promise<LocationReservationResponse> {
    try {
      const existingLocationReservation = await LocationReservation.findOne({
        where: {
          id: locationReservationId,
        },
      });
      if (!existingLocationReservation) {
        throw new Error("Location Reservation not found!");
      }

      const payments = await Payment.find({
        where: { locationReservationId },
        relations: ["users"],
      });

      if (status === LOCATION_RESERVATION_STATUS.Published) {
        payments.forEach(async (payment) => {
          try {
            if (payment.status === PAYMENT_STATUS.MissingLivingPrice) {
              payment.status = PAYMENT_STATUS.Unpaid;
            }
            await payment.save();
            console.log(payment?.users);

            payment?.users.forEach((user) => {
              createAndPushNotification(
                {
                  content: `You have new payment for ${dayjs(
                    existingLocationReservation?.startDate
                  ).format(
                    "MMMM"
                  )}. Please consider to check this payment as soon as possible. Thank you!`,
                  locationId: existingLocationReservation.locationId,
                  dataId: payment?.id,
                  title: "New Payment",
                  userId: user?.id,
                  type: NOTIFICATION_TYPE.Payment,
                },
                [user]
              );
            });
          } catch (error) {
            throw new Error(error);
          }
        });
      } else if (
        existingLocationReservation?.status ===
        LOCATION_RESERVATION_STATUS.Published
      ) {
        payments.forEach(async (payment) => {
          try {
            if (payment.status === PAYMENT_STATUS.Paid) {
              payment.status = PAYMENT_STATUS.Unpaid;
              existingLocationReservation.totalReceivedPrice = 0;
            }
            await payment.save();
          } catch (error) {
            throw new Error(error);
          }
        });
      }

      existingLocationReservation.status = status;

      return {
        message: "Change Location Reservation Status successfully!",
        locationReservation: await existingLocationReservation.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => String)
  @UseMiddleware(authMiddleware)
  async deleteLocationReservation(@Arg("id") id: number): Promise<string> {
    try {
      const existingLocationReservation = await LocationReservation.findOne({
        where: {
          id,
        },
      });
      if (!existingLocationReservation) {
        throw new Error("Location Reservation not found!");
      }

      const locationReservationPayments = await Payment.find({
        where: {
          locationReservationId: existingLocationReservation.id,
        },
      });

      await Payment.remove(locationReservationPayments);

      await LocationReservation.delete(existingLocationReservation?.id);

      return "Deleted location reservation";
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => LocationReservationResponse)
  @UseMiddleware(authMiddleware)
  async upsertLocationReservation(
    @Arg("input")
    {
      id,
      createdById,
      locationId,
      startDate,
      status,
    }: UpsertLocationReservationInput
  ): Promise<LocationReservationResponse> {
    const existingLocation = await Location.findOne({
      where: { id: locationId },
    });

    if (!existingLocation) {
      throw new Error("Location not found!");
    }

    const existingCreatedByUser = await User.findOne({
      where: { id: createdById },
    });

    if (!existingCreatedByUser) {
      throw new Error("User not found!");
    }
    if (existingCreatedByUser?.locationId !== locationId) {
      throw new Error(PermissionDeniedError);
    }

    try {
      if (id) {
        // UPDATE SECTION
        const existingLocationReservation = await LocationReservation.findOne({
          where: { id },
        });

        if (!existingLocationReservation)
          throw new Error("Location reservation Not Found");

        if (startDate) {
          const compareStartDate = dayjs
            .utc(startDate)
            .startOf("month")
            .toDate();
          const compareEndDate = dayjs.utc(startDate).endOf("month").toDate();
          const existingLocationReservationInSameMonth =
            await LocationReservation.findOne({
              where: {
                startDate: Between(compareStartDate, compareEndDate),
                locationId,
              },
            });
          if (
            existingLocationReservationInSameMonth &&
            existingLocationReservationInSameMonth?.id !==
              existingLocationReservation?.id
          ) {
            throw new Error(
              "Location reservation for this month has been created!"
            );
          }
        }

        LocationReservation.merge(existingLocationReservation, {
          createdById,
          locationId,
          startDate,
          status,
        });

        return {
          message: "Update location reservation successfully",
          locationReservation: await existingLocationReservation.save(),
        };
      } else {
        // CREATE SECTION
        if (startDate) {
          const compareStartDate = dayjs
            .utc(startDate)
            .startOf("month")
            .toDate();
          const compareEndDate = dayjs.utc(startDate).endOf("month").toDate();
          const existingLocationReservationInSameMonth =
            await LocationReservation.findOne({
              where: {
                locationId,
                startDate: Between(compareStartDate, compareEndDate),
              },
            });
          if (existingLocationReservationInSameMonth) {
            throw new Error(
              "Location reservation for this month has been created!"
            );
          }
        }

        const existingLocation = await Location.findOne({
          where: { id: locationId },
        });

        if (!existingLocation) {
          throw new Error("Location Not Found");
        }

        const newLocationReservation = await LocationReservation.save(
          await LocationReservation.create({
            createdById,
            locationId,
            startDate,
            status,
            totalReceivedPrice: 0,
            totalCalculatedPrice: 0,
          })
        );

        console.log("id", newLocationReservation?.id);

        const currentLocationRooms = await Room.find({
          where: {
            locationId,
            status: ROOM_STATUS.Owned,
          },
          relations: ["users"],
        });

        await Promise.all(
          currentLocationRooms?.map(async (room) => {
            await Payment.save(
              await Payment.create({
                locationId,
                locationReservationId: newLocationReservation?.id,
                roomId: room?.id,
                users: room?.users,
                status: PAYMENT_STATUS.MissingLivingPrice,
                electricCounter: 0,
                totalPrice: room?.basePrice,
                waterPrice: 0,
                extraFee: 0,
                prePaidFee: 0,
              })
            );

            newLocationReservation.totalCalculatedPrice =
              (newLocationReservation.totalCalculatedPrice ?? 0) +
              room?.basePrice;
            await newLocationReservation.save();
          })
        );

        return {
          message: "Create location reservation successfully",
          locationReservation: await newLocationReservation.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
