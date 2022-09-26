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
    { address, description, id, image, name, status }: UpsertLocationInput,
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
          if (image) existingLocation.image = image;
          if (
            status !== undefined &&
            status !== null &&
            user?.role === USER_ROLE.SuperAdmin
          )
            existingLocation.status = status;

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
          });

          if (description) newLocation.description = description;
          if (image) newLocation.image = image;
          if (status !== undefined && status !== null)
            newLocation.status = status;

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
    @Arg("input") { id, status }: UpdateLocationStatusInput,
    @Ctx() { user }: Context
  ): Promise<LocationResponse> {
    try {
      if (user?.role === USER_ROLE.SuperAdmin) {
        const existingLocation = await Location.findOne({ where: { id } });
        if (!existingLocation) throw new Error("Location Not Found.");
        existingLocation.status = status;

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
