import { Context } from "./../types/Context";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import {
  EquipmentListResponse,
  EquipmentResponse,
  GetEquipmentsInput,
  UpdateEquipmentStatusInput,
  UpsertEquipmentInput,
} from "../types/equipment";
import { Equipment, Room, EquipmentType } from "../entities";
import { USER_ROLE } from "../constants";
import {
  InternalServerError,
  OutOfBoundsError,
  PermissionDeniedError,
} from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ILike } from "typeorm";

@Resolver()
export class EquipmentResolver {
  @Query((_returns) => EquipmentResponse)
  @UseMiddleware(authMiddleware)
  async getEquipment(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<EquipmentResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const existingEquipment = await Equipment.findOne({
        where: { id },
        relations: ["room", "equipmentType"],
      });

      if (!existingEquipment) throw new Error("Equipment Not Found");

      return {
        message: "Get Equipment successfully",
        equipment: existingEquipment,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => EquipmentListResponse)
  @UseMiddleware(authMiddleware)
  async getEquipments(
    @Arg("input")
    {
      limit,
      page,
      orderBy,
      name,
      status,
      roomId,
      equipmentTypeId,
    }: GetEquipmentsInput,
    @Ctx() { user }: Context
  ): Promise<EquipmentListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      let options = {
        ...(name && { name: ILike(`%${name}%`) }),
        ...(status !== undefined && status !== null && { status }),
        ...(roomId && { roomId }),
        ...(equipmentTypeId && { equipmentTypeId }),
      };

      const [result, total] = await Equipment.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["equipmentType", "room"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Equipment successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => EquipmentResponse)
  @UseMiddleware(authMiddleware)
  async updateEquipmentStatus(
    @Arg("input") { id, status }: UpdateEquipmentStatusInput,
    @Ctx() { user }: Context
  ): Promise<EquipmentResponse> {
    try {
      const existingEquipment = await Equipment.findOne({
        where: { id },
        relations: ["equipmentType", "room"],
      });

      if (!existingEquipment) throw new Error("Equipment Not Found");

      const existingRoom = await Room.findOne({
        where: { id: existingEquipment.roomId },
      });

      if (
        user?.role === USER_ROLE.SuperAdmin ||
        (user?.role === USER_ROLE.Admin &&
          user?.locationId === existingRoom?.locationId)
      ) {
        existingEquipment.status = status;
        return {
          message: "Update Equipment Status successfully",
          equipment: await existingEquipment.save(),
        };
      } else {
        throw new Error(PermissionDeniedError);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => EquipmentResponse)
  @UseMiddleware(authMiddleware)
  async upsertEquipment(
    @Arg("input")
    { name, roomId, equipmentTypeId, id, image, status }: UpsertEquipmentInput,
    @Ctx() { user }: Context
  ): Promise<EquipmentResponse> {
    try {
      const existingRoom = await Room.findOne({ where: { id: roomId } });
      if (!existingRoom) throw new Error("Room Not Found");

      if (
        (user?.role === USER_ROLE.Admin &&
          existingRoom.locationId === user?.locationId) ||
        user?.role === USER_ROLE.SuperAdmin
      ) {
        if (id) {
          // UPDATE EQUIPMENT SECTION
          const existingEquipment = await Equipment.findOne({ where: { id } });
          if (!existingEquipment) throw new Error("Equipment Not Found");

          if (name) existingEquipment.name = name;
          if (roomId) {
            existingEquipment.roomId = roomId;
            existingEquipment.room = existingRoom;
          }
          if (equipmentTypeId) {
            const existingEquipmentType = await EquipmentType.findOne({
              where: { id: equipmentTypeId },
            });
            if (!existingEquipmentType)
              throw new Error("Equipment Type Not Found");
            existingEquipment.equipmentTypeId = equipmentTypeId;
            existingEquipment.equipmentType = existingEquipmentType;
          }
          if (image) existingEquipment.image = image;
          if (status !== undefined && status !== null)
            existingEquipment.status = status;

          return {
            message: "Update Equipment successfully",
            equipment: await existingEquipment.save(),
          };
        } else {
          // CREATE EQUIPMENT SECTION
          if (!equipmentTypeId)
            throw new Error(
              "Must include equipmentTypeId when create Equipment"
            );

          const newEquipment = await Equipment.create({
            name,
            roomId,
            equipmentTypeId,
          });

          const existingEquipmentType = await EquipmentType.findOne({
            where: { id: equipmentTypeId },
          });
          if (!existingEquipmentType)
            throw new Error("Equipment Type Not Found");
          newEquipment.equipmentType = existingEquipmentType;

          if (roomId) newEquipment.room = existingRoom;
          if (status !== undefined && status !== null)
            newEquipment.status = status;
          if (image) newEquipment.image = image;

          return {
            message: "Create Equipment successfully",
            equipment: await newEquipment.save(),
          };
        }
      } else {
        throw new Error(PermissionDeniedError);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
