import { Incident } from "./../entities/Incident";
import { Equipment } from "./../entities/Equipment";
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
import { LessThanOrEqual, ILike, MoreThanOrEqual, Between } from "typeorm";
import { ROOM_STATUS, USER_ROLE } from "../constants";
import { Location, Payment } from "../entities";

@Resolver()
export class RoomResolver {
  @Query((_returns) => RoomResponse)
  async getRoom(@Arg("id") id: number): Promise<RoomResponse> {
    try {
      const existingRoom = await Room.findOne({
        where: { id },
        relations: ["location", "equipments", "users"],
      });
      if (!existingRoom) throw new Error(RoomNotFoundError);
      if (existingRoom.status !== ROOM_STATUS.NotAvailable) {
        if (!existingRoom?.users?.[0]) {
          existingRoom.status = ROOM_STATUS.Available;
        } else {
          existingRoom.status = ROOM_STATUS.Owned;
        }
      }

      return {
        message: "Get Room successfully",
        room: await existingRoom.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => RoomListResponse)
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
      floor,
      capacity,
    }: GetRoomsInput
  ): Promise<RoomListResponse> {
    try {
      const options = {
        ...(status && { status }),
        ...(minBasePrice !== undefined &&
          minBasePrice !== null && {
            basePrice: MoreThanOrEqual(minBasePrice),
          }),
        ...(maxBasePrice !== undefined &&
          maxBasePrice !== null && {
            basePrice: LessThanOrEqual(maxBasePrice),
          }),
        ...(minBasePrice !== undefined &&
          minBasePrice !== null &&
          maxBasePrice !== undefined &&
          maxBasePrice !== null && {
            basePrice: Between(minBasePrice, maxBasePrice),
          }),
        ...(floor && { floor }),
        ...(capacity && { capacity }),
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
        relations: ["location", "equipments", "users"],
      });

      await Promise.all(
        result.map((room) => {
          if (room.status !== ROOM_STATUS.NotAvailable) {
            if (!room?.users?.[0]) {
              room.status = ROOM_STATUS.Available;
            } else {
              room.status = ROOM_STATUS.Owned;
            }
          }
          return room.save();
        })
      );

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
    @Ctx() { user: currentUser }: Context
  ): Promise<RoomResponse> {
    const { id, floor, ...rest } = upsertRoomInput;
    try {
      if (currentUser?.role !== USER_ROLE.Admin)
        throw new Error(PermissionDeniedError);

      if (id) {
        // UPDATE Room
        const existingRoom = await Room.findOne({
          where: { id },
          relations: ["location"],
        });
        if (!existingRoom) throw new Error(RoomNotFoundError);

        const currentLocation = await Location.findOne({
          where: { id: existingRoom?.locationId },
        });

        if (!currentLocation) {
          throw new Error("Location Not Found");
        }
        if (currentUser.locationId !== existingRoom.locationId)
          throw new Error(PermissionDeniedError);

        Room.merge(existingRoom, { ...rest });

        if (floor && currentLocation?.numOfFloor) {
          if (floor < 0 || floor > currentLocation?.numOfFloor) {
            throw new Error(
              `Room floor can't greater than current location's floor or less than 1`
            );
          }
          existingRoom.floor = floor;
        }

        return {
          message: "Upsert Room successfully",
          room: await existingRoom.save(),
        };
      } else {
        // CREATE Room
        const existingLocation = await Location.findOne({
          where: { id: currentUser?.locationId },
        });
        if (!existingLocation) throw new Error(LocationNotFoundError);

        const newRoom = await Room.create({
          ...rest,
          locationId: existingLocation?.id,
        });

        if (floor && existingLocation?.numOfFloor) {
          if (floor < 0 || floor > existingLocation?.numOfFloor) {
            throw new Error(
              `Room floor can't greater than current location's floor or less than 1`
            );
          }
          newRoom.floor = floor;
        }

        newRoom.status = ROOM_STATUS.Available;

        return {
          message: "Upsert Room successfully",
          room: await newRoom.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => String)
  @UseMiddleware(authMiddleware)
  async deleteRoom(@Arg("id") id: number): Promise<string> {
    try {
      const existingRoom = await Room.findOne({ where: { id } });

      if (!existingRoom) {
        throw new Error("Room not found!");
      }

      const roomEquipments = await Equipment.find({
        where: {
          roomId: existingRoom.id,
        },
      });

      await Equipment.remove(roomEquipments);

      const roomPayments = await Payment.find({
        where: {
          roomId: existingRoom.id,
        },
      });

      await Payment.remove(roomPayments);

      const roomIncidents = await Incident.find({
        where: {
          roomId: existingRoom.id,
        },
      });

      await Incident.remove(roomIncidents);

      await Room.delete(existingRoom.id);

      return "Delete room successfully!";
    } catch (error) {
      throw new Error(error);
    }
  }
}
