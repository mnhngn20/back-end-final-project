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
import { ILike } from "typeorm";
import { Context } from "../types/Context";
import { USER_ROLE } from "../constants";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { ContactInformation } from "../entities/ContactInformation";

@Resolver()
export class LocationResolver {
  @Query((_returns) => LocationResponse)
  @UseMiddleware(authMiddleware)
  async getLocation(@Arg("id") id: number): Promise<LocationResponse> {
    try {
      const existingLocation = await Location.findOne({
        where: { id },
        relations: ["contactInformations"],
      });
      if (!existingLocation) throw new Error("Location Not Found");
      return {
        message: "Get Location successfully",
        location: existingLocation,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => LocationListResponse)
  @UseMiddleware(authMiddleware)
  async getLocations(
    @Arg("input")
    { address, name, isActive, limit, orderBy, page }: GetLocationsInput
  ): Promise<LocationListResponse> {
    try {
      const options = {
        ...(address && { address: ILike(`%${address}%`) }),
        ...(name && { name: ILike(`%${name}%`) }),
        ...(isActive !== undefined && { isActive }),
      };
      const [result, total] = await Location.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["contactInformations"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Locations successfully",
        items: result,
        page,
        total,
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
    const { id, isActive, contactInformations, ...rest } = upsertLocationInput;
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

          const newLocation = await Location.create({
            ...upsertLocationInput,
          });

          await newLocation.save();

          if (contactInformations) {
            contactInformations.forEach(async (contactInformation) => {
              const newContactInformation = await ContactInformation.create({
                ...contactInformation,
                locationId: newLocation.id,
              });
              await newContactInformation.save();
            });
          }

          return {
            message: "Create Location successfully",
            location: newLocation,
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
