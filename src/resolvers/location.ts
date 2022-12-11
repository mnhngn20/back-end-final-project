import { updateLocationTotalRevenue } from "./../utils/helper";
import { LocationService } from "./../entities/LocationService";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { authMiddleware } from "../middlewares/auth-middleware";
import {
  GetLocationsInput,
  LocationListResponse,
  LocationResponse,
  UpsertLocationInput,
  UpdateLocationStatusInput,
} from "../types/location";
import { Location } from "../entities/Location";
import { Context } from "../types/Context";
import { ORDER_BY, USER_ROLE } from "../constants";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { ContactInformation } from "../entities/ContactInformation";
import { convertCoordToGeo } from "../utils/geoLocation";

@Resolver()
export class LocationResolver {
  @Query((_returns) => LocationResponse)
  async getLocation(@Arg("id") id: number): Promise<LocationResponse> {
    try {
      const existingLocation = await Location.findOne({
        where: { id },
        relations: [
          "contactInformations",
          "locationServices",
          "amenities",
          "users",
          "locationReservations",
        ],
      });

      if (!existingLocation) throw new Error("Location Not Found");

      await updateLocationTotalRevenue(existingLocation);

      return {
        message: "Get Location successfully",
        location: existingLocation,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => LocationListResponse)
  async getLocations(
    @Arg("input")
    {
      address,
      name,
      isActive,
      limit,
      orderBy,
      page,
      locationServiceIds,
      lat,
      distance,
      long,
      minPrice,
      maxPrice,
    }: GetLocationsInput
  ): Promise<LocationListResponse> {
    try {
      const builder = Location.createQueryBuilder("location")
        .leftJoinAndSelect(
          "location.contactInformations",
          "contactInformations"
        )
        .leftJoinAndSelect("location.locationServices", "locationService")
        .leftJoinAndSelect("location.amenities", "amenity")
        .where(`"location"."id" IS NOT NULL`);

      if (orderBy) {
        const [field, order] = orderBy.split(":");
        builder.orderBy(field, order as ORDER_BY);
      } else {
        builder.orderBy("location.createdAt", ORDER_BY.DESC);
      }

      if (lat && long) {
        builder.andWhere(
          "ST_DWithin(location.geoLocation, ST_SetSRID(ST_Point(:longitude, :latitude), 4326), :distance, true)",
          {
            longitude: long,
            latitude: lat,
            distance: distance ?? 20000, //meter
          }
        );
      }

      if (minPrice) {
        builder.andWhere(`"location"."minPrice" >= :minPrice`, {
          minPrice,
        });
      }

      if (maxPrice) {
        builder.andWhere(`"location"."minPrice" <= :maxPrice`, {
          maxPrice,
        });
      }

      if (locationServiceIds) {
        builder.andWhere(`"locationService"."id" IN (:...locationServiceIds)`, {
          locationServiceIds,
        });
      }

      if (address) {
        builder.andWhere(`"location"."address" ILike :address`, {
          address: `%${address}%`,
        });
      }
      if (name) {
        builder.andWhere(`"location"."name" ILike :name`, {
          name: `%${name}%`,
        });
      }
      if (isActive !== undefined) {
        builder.andWhere(`"location"."isActive" = :isActive`, {
          isActive,
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
        message: "Get Locations successfully",
        items: data,
        page,
        total: total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => LocationResponse)
  @UseMiddleware(authMiddleware)
  async upsertLocation(
    @Arg("input")
    upsertLocationInput: UpsertLocationInput,
    @Ctx() { user }: Context
  ): Promise<LocationResponse> {
    const { id, isActive, contactInformations, locationServiceIds, ...rest } =
      upsertLocationInput;

    const locationServices: LocationService[] = [];

    if (locationServiceIds) {
      locationServiceIds?.forEach(async (id) => {
        try {
          const existingLocationService = await LocationService.findOne({
            where: { id },
          });

          if (!existingLocationService) {
            throw new Error("Location Service Not Found");
          }

          locationServices.push(existingLocationService);
        } catch (error) {
          throw new Error(error);
        }
      });
    }

    try {
      if (id) {
        // UPDATE LOCATION
        if (
          (user?.role === USER_ROLE.Admin && user.locationId === id) ||
          user?.role === USER_ROLE.SuperAdmin
        ) {
          const existingLocation = await Location.findOne({
            where: { id },
          });
          if (!existingLocation) throw new Error("Location Not Found");

          Location.merge(existingLocation, { ...rest });

          if (
            isActive !== undefined &&
            isActive !== null &&
            user?.role === USER_ROLE.SuperAdmin
          )
            existingLocation.isActive = isActive;

          existingLocation.locationServices = locationServices;

          const locationContactInformations = await ContactInformation.find({
            where: { locationId: existingLocation?.id },
          });

          if (contactInformations) {
            contactInformations.forEach(async (contactInformation) => {
              if (contactInformation.id) {
                const foundContact = await ContactInformation.findOne({
                  where: { id: contactInformation.id },
                });
                if (!foundContact)
                  throw new Error("Contact Information Not Found");

                ContactInformation.merge(foundContact, {
                  ...contactInformation,
                });
                await foundContact.save();
              } else {
                const newContactInformation = await ContactInformation.create({
                  ...contactInformation,
                  locationId: existingLocation.id,
                });
                await newContactInformation.save();
              }
            });
            locationContactInformations?.forEach(
              async (locationContactInformation) => {
                if (
                  !contactInformations?.some(
                    (item) => item?.id === locationContactInformation.id
                  )
                ) {
                  await ContactInformation.delete(
                    locationContactInformation.id
                  );
                }
              }
            );
          }

          if (existingLocation?.lat && existingLocation?.long)
            await convertCoordToGeo(existingLocation.id, {
              lat: existingLocation?.lat,
              long: existingLocation?.long,
            });

          return {
            message: "Update Location successfully",
            location: await existingLocation.save(),
          };
        } else {
          throw new Error(PermissionDeniedError);
        }
      } else {
        // CREATE LOCATION
        if (user?.role === USER_ROLE.SuperAdmin) {
          if (!upsertLocationInput?.name)
            throw new Error("Must include name when create Location!");
          if (!upsertLocationInput?.address)
            throw new Error("Must include address when create Location!");

          const newLocation = await Location.save(
            await Location.create({
              ...upsertLocationInput,
            })
          );

          newLocation.locationServices = locationServices;

          if (newLocation?.lat && newLocation?.long)
            await convertCoordToGeo(newLocation.id, {
              lat: newLocation?.lat,
              long: newLocation?.long,
            });
          return {
            message: "Create Location successfully",
            location: await newLocation.save(),
          };
        } else {
          throw new Error(PermissionDeniedError);
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => LocationResponse)
  @UseMiddleware(authMiddleware)
  async updateLocationStatus(
    @Arg("input") { id, isActive }: UpdateLocationStatusInput,
    @Ctx() { user: currentUser }: Context
  ): Promise<LocationResponse> {
    try {
      if (currentUser?.role === USER_ROLE.SuperAdmin) {
        const existingLocation = await Location.findOne({ where: { id } });
        if (!existingLocation) throw new Error("Location Not Found.");

        existingLocation.isActive = isActive;

        return {
          message: "Update location's status successfully",
          location: await existingLocation.save(),
        };
      } else {
        throw new Error(PermissionDeniedError);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
