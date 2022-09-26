import { authMiddleware } from "../middlewares/auth-middleware";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Context } from "../types/Context";
import {
  InternalServerError,
  LocationNotFoundError,
  OutOfBoundsError,
  PermissionDeniedError,
  RoomTypeNotFoundError,
} from "../types/Errors";
import { Location, RoomType } from "../entities";
import {
  GetRoomTypesInput,
  RoomTypeListResponse,
  RoomTypeResponse,
  UpsertRoomTypeInput,
} from "../types/roomTypes";
import { USER_ROLE } from "../constants";
import { ILike, IsNull } from "typeorm";

@Resolver()
export class RoomTypeResolver {
  @Query((_returns) => RoomTypeResponse)
  @UseMiddleware(authMiddleware)
  async getRoomType(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<RoomTypeResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      const existingRoomType = await RoomType.findOne({
        where: { id },
        relations: ["location", "rooms", "plans"],
      });
      if (!existingRoomType) throw new Error(RoomTypeNotFoundError);
      return {
        message: "Get Room Type successfully",
        roomType: existingRoomType,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => RoomTypeListResponse)
  @UseMiddleware(authMiddleware)
  async getRoomTypes(
    @Arg("input")
    {
      limit,
      orderBy,
      page,
      keyword,
      name,
      description,
      locationId,
    }: GetRoomTypesInput,
    @Ctx() { user }: Context
  ): Promise<RoomTypeListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      let options;
      if (user.role === USER_ROLE.Admin || user.role === USER_ROLE.Employee) {
        if (keyword) {
          options = [
            {
              name: ILike(`%${keyword}%`),
              locationId: user.locationId,
            },
            {
              name: ILike(`%${keyword}%`),
              locationId: IsNull(),
            },
            {
              description: ILike(`%${keyword}%`),
              locationId: user.locationId,
            },
            {
              description: ILike(`%${keyword}%`),
              locationId: IsNull(),
            },
          ];
        } else {
          options = [
            {
              locationId: user.locationId,
              ...(name && { name: ILike(`%${name}%`) }),
              ...(description && { description: ILike(`%${description}%`) }),
            },
            {
              locationId: IsNull(),
              ...(name && { name: ILike(`%${name}%`) }),
              ...(description && { description: ILike(`%${description}%`) }),
            },
          ];
        }
      } else if (user.role === USER_ROLE.SuperAdmin) {
        const locationOption = locationId !== undefined && {
          locationId: locationId ?? IsNull(),
        };
        if (keyword) {
          options = [
            {
              name: ILike(`%${keyword}%`),
              ...locationOption,
            },
            {
              description: ILike(`%${keyword}%`),
              ...locationOption,
            },
          ];
        } else {
          options = {
            ...locationOption,
            ...(name && { name: ILike(`%${name}%`) }),
            ...(description && { description: ILike(`%${description}%`) }),
          };
        }
      } else throw new Error(PermissionDeniedError);

      const [result, total] = await RoomType.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["location", "rooms", "plans"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get room types successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => RoomTypeResponse)
  @UseMiddleware(authMiddleware)
  async upsertRoomType(
    @Arg("input")
    { id, name, description }: UpsertRoomTypeInput,
    @Ctx() { user }: Context
  ): Promise<RoomTypeResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      if (user.role !== USER_ROLE.Admin && user.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);

      const targetLocationId =
        user.role === USER_ROLE.Admin ? user.locationId : undefined;

      if (targetLocationId) {
        const location = await Location.find({
          where: { id: targetLocationId, status: true },
        });
        if (!location) throw new Error(LocationNotFoundError);
      }

      if (id) {
        // UPDATE RoomType
        const existingRoomType = await RoomType.findOne({ where: { id } });
        if (!existingRoomType) throw new Error(RoomTypeNotFoundError);

        if (name) existingRoomType.name = name;
        if (description) existingRoomType.description = description;

        return {
          message: "Update RoomType successfully",
          roomType: await existingRoomType.save(),
        };
      } else {
        // CREATE RoomType
        const newRoomType = await RoomType.create({
          locationId: targetLocationId,
          name,
          description,
        });
        return {
          message: "Create RoomType successfully",
          roomType: await newRoomType.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
