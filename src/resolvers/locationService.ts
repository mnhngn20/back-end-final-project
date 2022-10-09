import {
  LocationServiceResponse,
  LocationServiceListResponse,
  GetLocationServicesInput,
  UpsertLocationServiceInput,
} from "./../types/locationService";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { authMiddleware } from "../middlewares/auth-middleware";
import { Context } from "../types/Context";
import { USER_ROLE } from "../constants";
import {
  InternalServerError,
  OutOfBoundsError,
  PermissionDeniedError,
} from "../types/Errors";
import { LocationService } from "../entities";
import { ILike } from "typeorm";

@Resolver()
export class LocationServiceResolver {
  @Query((_returns) => LocationServiceResponse)
  @UseMiddleware(authMiddleware)
  async getLocationService(
    @Arg("id")
    id: number
  ): Promise<LocationServiceResponse> {
    try {
      const existingLocationService = await LocationService.findOne({
        where: { id },
      });

      if (!existingLocationService)
        throw new Error("Location Service Not Found");
      return {
        message: "Get Location Service successfully",
        locationService: existingLocationService,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => LocationServiceListResponse)
  @UseMiddleware(authMiddleware)
  async getLocationServices(
    @Arg("input")
    { limit, orderBy, page, name, isActive }: GetLocationServicesInput,
    @Ctx()
    { user }: Context
  ): Promise<LocationServiceListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const options = {
        ...(isActive !== undefined && isActive !== null && { isActive }),
        ...(name && {
          name: ILike(`%${name}%`),
        }),
      };

      const [result, total] = await LocationService.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Location Services successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => LocationServiceResponse)
  @UseMiddleware(authMiddleware)
  async upsertLocationService(
    @Arg("input")
    { id, ...rest }: UpsertLocationServiceInput,
    @Ctx()
    { user: currentUser }: Context
  ): Promise<LocationServiceResponse> {
    if (currentUser?.role !== USER_ROLE.SuperAdmin)
      throw new Error(PermissionDeniedError);
    try {
      if (id) {
        // UPDATE SECTION
        const existingLocationService = await LocationService.findOne({
          where: { id },
        });

        if (!existingLocationService)
          throw new Error("Location Service Not Found");

        LocationService.merge(existingLocationService, { ...rest });

        return {
          message: "Update Location Service successfully",
          locationService: await existingLocationService.save(),
        };
      } else {
        // CREATE SECTION
        const newLocationService = await LocationService.create({
          ...rest,
        });

        return {
          message: "Create Location Service successfully",
          locationService: await newLocationService.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
