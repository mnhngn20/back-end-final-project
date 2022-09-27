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
      const existingLocation = await Location.findOne({ where: { id } });
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
    { address, name, status, limit, orderBy, page, keyword }: GetLocationsInput
  ): Promise<LocationListResponse> {
    try {
      let options;
      if (keyword) {
        options = [
          {
            ...(status !== undefined && { status }),
            name: ILike(`%${keyword}%`),
          },
          {
            ...(status !== undefined && { status }),
            address: ILike(`%${keyword}%`),
          },
        ];
      } else {
        options = {
          ...(address && { address: ILike(`%${address}%`) }),
          ...(name && { name: ILike(`%${name}%`) }),
          ...(status !== undefined && { status }),
        };
      }
      const [result, total] = await Location.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
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
    {
      address,
      description,
      id,
      contactInformations,
      name,
      images,
      isActive,
      lat,
      long,
      thumbnail,
    }: UpsertLocationInput,
    @Ctx() { user }: Context
  ): Promise<LocationResponse> {
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

          if (name) existingLocation.name = name;
          if (address) existingLocation.address = address;
          if (description) existingLocation.description = description;
          if (images) existingLocation.images = images;
          if (thumbnail) existingLocation.thumbnail = thumbnail;
          if (lat) existingLocation.lat = lat;
          if (long) existingLocation.long = long;
          if (
            isActive !== undefined &&
            isActive !== null &&
            user?.role === USER_ROLE.SuperAdmin
          )
            existingLocation.isActive = isActive;
          if (contactInformations) {
            contactInformations.forEach(async (contactInformation) => {
              if (contactInformation.id) {
                const foundContact = await ContactInformation.findOne({
                  where: { id },
                });
                if (!foundContact)
                  throw new Error("Contact Information Not Found");
                if (contactInformation.address)
                  foundContact.address = contactInformation.address;
                if (contactInformation.email)
                  foundContact.email = contactInformation.email;
                if (contactInformation.name)
                  foundContact.name = contactInformation.name;
                if (contactInformation.phoneNumber)
                  foundContact.phoneNumber = contactInformation.phoneNumber;
              } else {
                const newContactInformation = await ContactInformation.create({
                  ...contactInformation,
                  locationId: existingLocation.id,
                });
                await newContactInformation.save();
              }
            });
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
          if (!name) throw new Error("Must include name when create Location!");
          if (!address)
            throw new Error("Must include address when create Location!");

          const newLocation = await Location.create({
            address,
            name,
            description,
            images,
            thumbnail,
            lat,
            long,
          });

          if (description) newLocation.description = description;
          if (images) newLocation.images = images;
          if (isActive !== undefined && isActive !== null)
            newLocation.isActive = isActive;

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
