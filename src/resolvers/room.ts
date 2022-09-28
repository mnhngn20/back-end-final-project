import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Room } from "../entities/Room";
import {
  InternalServerError,
  InvalidInputError,
  LocationNotFoundError,
  OutOfBoundsError,
  PermissionDeniedError,
  RoomNotFoundError,
} from "../types/Errors";
import { Context } from "../types/Context";
import { authMiddleware } from "../middlewares/auth-middleware";
import {
  GetRoomsInput,
  RoomListResponse,
  RoomResponse,
  UpsertRoomInput,
} from "../types/room";
import { LessThanOrEqual, ILike, MoreThanOrEqual } from "typeorm";
import { USER_ROLE } from "../constants";
import { Location } from "../entities";

@Resolver()
export class RoomResolver {
  @Query((_returns) => RoomResponse)
  @UseMiddleware(authMiddleware)
  async getRoom(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<RoomResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      const existingRoom = await Room.findOne({
        where: { id },
        relations: ["location", "equipments"],
      });
      if (!existingRoom) throw new Error(RoomNotFoundError);
      return {
        message: "Get Room successfully",
        room: existingRoom,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => RoomListResponse)
  @UseMiddleware(authMiddleware)
  async getRooms(
    @Arg("input")
    {
      limit,
      page,
      orderBy,
      name,
      locationId,
      status,
      minBasePrice,
      maxBasePrice,
    }: GetRoomsInput,
    @Ctx() { user }: Context
  ): Promise<RoomListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const options = {
        ...(status !== undefined && status !== null && { status }),
        ...(minBasePrice !== undefined &&
          minBasePrice !== null && {
            basePrice: MoreThanOrEqual(minBasePrice),
          }),
        ...(maxBasePrice !== undefined &&
          maxBasePrice !== null && {
            basePrice: LessThanOrEqual(maxBasePrice),
          }),
        ...(locationId && { locationId }),
        ...(name && {
          name: ILike(`%${name}%`),
        }),
      };

      const [result, total] = await Room.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["location", "equipments"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get rooms successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => RoomResponse)
  @UseMiddleware(authMiddleware)
  async upsertRoom(
    @Arg("input")
    upsertRoomInput: UpsertRoomInput,
    @Ctx() { user }: Context
  ): Promise<RoomResponse> {
    const { id, locationId, ...rest } = upsertRoomInput;
    try {
      if (!user?.id) throw new Error(InternalServerError);
      if (user.role !== USER_ROLE.Admin && user.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);

      if (id) {
        // UPDATE Room
        const existingRoom = await Room.findOne({
          where: { id },
          relations: ["location"],
        });
        if (!existingRoom) throw new Error(RoomNotFoundError);

        if (
          user.role === USER_ROLE.Admin &&
          user.locationId !== existingRoom.locationId
        )
          throw new Error(PermissionDeniedError);

        Room.merge(existingRoom, { ...rest });

        if (locationId && user.role === USER_ROLE.SuperAdmin) {
          const location = await Location.findOne({
            where: { id: locationId },
          });
          if (!location) throw new Error(LocationNotFoundError);
          existingRoom.locationId = locationId;
        }

        return {
          message: "Upsert Room successfully",
          room: await existingRoom.save(),
        };
      } else {
        // CREATE Room
        if (user.role === USER_ROLE.SuperAdmin && locationId === undefined)
          throw new Error(InvalidInputError);

        const newRoomLocationId =
          user.role === USER_ROLE.Admin ? user.locationId : locationId;

        const location = await Location.findOne({
          where: { id: newRoomLocationId },
        });
        if (!location) throw new Error(LocationNotFoundError);

        const newRoom = await Room.create({
          ...rest,
          locationId: newRoomLocationId,
        });

        return {
          message: "Upsert Room successfully",
          room: await newRoom.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
