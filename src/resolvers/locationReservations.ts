import { User } from "./../entities/User";
import { LocationReservation } from "./../entities/LocationReservation";
import { Location } from "./../entities/Location";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import {
  GetLocationReservationsInput,
  LocationReservationListResponse,
  LocationReservationResponse,
  UpsertLocationReservationInput,
} from "../types/locationReservation";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import dayjs from "dayjs";

@Resolver()
export class LocationReservationResolver {
  @Query((_returns) => LocationReservationResponse)
  async getLocationReservation(
    @Arg("id") id: number
  ): Promise<LocationReservationResponse> {
    try {
      const existingLocationReservation = await LocationReservation.findOne({
        where: { id },
        relations: ["location", "createdBy"],
      });

      if (!existingLocationReservation)
        throw new Error("Location reservation not found");

      return {
        message: "Get location reservation successfully!",
        locationReservation: existingLocationReservation,
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
        ...(fromDate && { startDate: LessThanOrEqual(fromDate) }),
        ...(toDate && { startDate: MoreThanOrEqual(toDate) }),
        ...(status && { status }),
      };

      const [result, total] = await LocationReservation.findAndCount({
        order: { createdAt: orderBy },
        take: limit,
        where: options,
        skip: (page - 1) * limit,
        relations: ["location", "createdBy"],
      });

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

        const newLocationReservation = await LocationReservation.create({
          createdById,
          locationId,
          startDate,
          status,
          totalCalculatedPrice: 0,
          totalReceivedPrice: 0,
        });

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
