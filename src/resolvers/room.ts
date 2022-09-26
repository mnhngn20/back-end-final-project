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
  RoomTypeNotFoundError,
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
import { Location, RoomType } from "../entities";

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
        relations: ["location", "roomType", "equipments"],
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
      floor,
      keyword,
      name,
      description,
      locationId,
      roomTypeId,
      status,
      minRate,
      minBasePrice,
      maxBasePrice,
    }: GetRoomsInput,
    @Ctx() { user }: Context
  ): Promise<RoomListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      let options;
      const commonOptions = {
        ...(status !== undefined && status !== null && { status }),
        ...(floor && { floor }),
        ...(minRate !== undefined &&
          minRate !== null && { overallRate: MoreThanOrEqual(minRate) }),
        ...(minBasePrice !== undefined &&
          minBasePrice !== null && {
            basePrice: MoreThanOrEqual(minBasePrice),
          }),
        ...(maxBasePrice !== undefined &&
          maxBasePrice !== null && {
            basePrice: LessThanOrEqual(maxBasePrice),
          }),
        ...(locationId && { locationId }),
        ...(roomTypeId && { roomTypeId }),
      };
      if (keyword) {
        options = [
          {
            name: ILike(`%${keyword}%`),
            ...commonOptions,
          },
          {
            description: ILike(`%${keyword}%`),
            ...commonOptions,
          },
        ];
      } else {
        options = {
          ...(name && { name: ILike(`%${name}%`) }),
          ...(description && { description: ILike(`%${description}%`) }),
          ...commonOptions,
        };
      }

      const [result, total] = await Room.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["location", "roomType"],
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
    {
      id,
      name,
      description,
      locationId,
      basePrice,
      floor,
      capacity,
      image,
      status,
      roomTypeId,
    }: UpsertRoomInput,
    @Ctx() { user }: Context
  ): Promise<RoomResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      if (user.role !== USER_ROLE.Admin && user.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);

      let room;
      if (id) {
        // UPDATE Room
        room = await Room.findOne({
          where: { id },
          relations: ["location", "roomType"],
        });
        if (!room) throw new Error(RoomNotFoundError);

        if (
          user.role === USER_ROLE.Admin &&
          user.locationId !== room.locationId
        )
          throw new Error(PermissionDeniedError);

        if (name) room.name = name;
        if (description) room.description = description;

        if (locationId && user.role === USER_ROLE.SuperAdmin) {
          const location = await Location.findOne({
            where: { id: locationId },
          });
          if (!location) throw new Error(LocationNotFoundError);
          room.locationId = locationId;
        }

        if (basePrice) room.basePrice = basePrice;
        if (floor) room.floor = floor;
        if (capacity !== undefined && capacity !== null)
          room.capacity = capacity;
        if (image) room.image = image;
        if (status !== undefined && status !== null) room.status = status;

        if (roomTypeId) {
          const roomType = await RoomType.findOne({
            where: { id: roomTypeId },
          });
          if (
            !roomType ||
            (roomType.locationId !== room.locationId && roomType.locationId)
          )
            throw new Error(RoomTypeNotFoundError);
          room.roomTypeId = roomTypeId;
        }
      } else {
        // CREATE Room
        if (
          roomTypeId === undefined ||
          floor === undefined ||
          basePrice === undefined
        )
          throw new Error(InvalidInputError);

        if (user.role === USER_ROLE.SuperAdmin && locationId === undefined)
          throw new Error(InvalidInputError);

        const newRoomLocationId =
          user.role === USER_ROLE.Admin ? user.locationId : locationId;

        const location = await Location.findOne({
          where: { id: newRoomLocationId },
        });
        if (!location) throw new Error(LocationNotFoundError);

        const roomType = await RoomType.findOne({
          where: { id: roomTypeId },
        });
        if (!roomType) throw new Error(RoomTypeNotFoundError);
        if (
          roomType.locationId !== newRoomLocationId &&
          roomType.locationId !== null
        )
          throw new Error(InvalidInputError);

        room = await Room.create({
          locationId: newRoomLocationId,
          roomTypeId,
          name,
          description,
          basePrice,
          floor,
          capacity,
          image,
        });
      }

      return {
        message: "Upsert Room successfully",
        room: await room.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
