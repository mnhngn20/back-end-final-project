import {
  EquipmentTypeListResponse,
  EquipmentTypeResponse,
  GetEquipmentTypesInput,
  UpsertEquipmentTypeInput,
} from "../types/equipmentType";
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
import { EquipmentType, Location } from "../entities";
import { ILike, IsNull } from "typeorm";

@Resolver()
export class EquipmentTypeResolver {
  @Query((_returns) => EquipmentTypeResponse)
  @UseMiddleware(authMiddleware)
  async getEquipmentType(
    @Arg("id")
    id: number
  ): Promise<EquipmentTypeResponse> {
    try {
      const existingEquipmentType = await EquipmentType.findOne({
        where: { id },
        relations: ["location"],
      });

      if (!existingEquipmentType) throw new Error("Equipment Type Not Found");
      return {
        message: "Get Equipment Type successfully",
        equipmentType: existingEquipmentType,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => EquipmentTypeListResponse)
  @UseMiddleware(authMiddleware)
  async getEquipmentTypes(
    @Arg("input")
    {
      limit,
      orderBy,
      page,
      locationId,
      keyword,
      name,
      description,
    }: GetEquipmentTypesInput,
    @Ctx()
    { user }: Context
  ): Promise<EquipmentTypeListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      let options;
      if (user?.role === USER_ROLE.Admin || user?.role === USER_ROLE.Employee) {
        if (keyword) {
          options = [
            {
              name: ILike(`%${keyword}%`),
              locationId: IsNull(),
            },
            {
              name: ILike(`%${keyword}%`),
              locationId: user?.locationId,
            },
            {
              description: ILike(`%${keyword}%`),
              locationId: IsNull(),
            },
            {
              description: ILike(`%${keyword}%`),
              locationId: user?.locationId,
            },
          ];
        } else {
          options = [
            {
              ...(name && { name: ILike(`%${name}%`) }),
              ...(description && { description: ILike(`%${description}%`) }),
              locationId: IsNull(),
            },
            {
              ...(name && { name: ILike(`%${name}%`) }),
              ...(description && { description: ILike(`%${description}%`) }),
              locationId: user?.locationId,
            },
          ];
        }
      } else if (user?.role === USER_ROLE.SuperAdmin) {
        if (keyword) {
          options = [
            {
              name: ILike(`%${keyword}%`),
              ...(locationId !== undefined && {
                locationId: locationId ?? IsNull(),
              }),
            },
            {
              description: ILike(`%${keyword}%`),
              ...(locationId !== undefined && {
                locationId: locationId ?? IsNull(),
              }),
            },
          ];
        } else {
          options = {
            ...(name && { name: ILike(`%${name}%`) }),
            ...(description && { description: ILike(`%${description}%`) }),
            ...(locationId !== undefined && {
              locationId: locationId ?? IsNull(),
            }),
          };
        }
      } else throw new Error(PermissionDeniedError);

      const [result, total] = await EquipmentType.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["location"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Equipment Types successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => EquipmentTypeResponse)
  @UseMiddleware(authMiddleware)
  async upsertEquipmentType(
    @Arg("input")
    { name, description, locationId, id }: UpsertEquipmentTypeInput,
    @Ctx()
    { user }: Context
  ): Promise<EquipmentTypeResponse> {
    try {
      if (id) {
        // UPDATE SECTION
        if (
          (user?.role === USER_ROLE.Admin && user?.locationId === locationId) ||
          user?.role === USER_ROLE.SuperAdmin
        ) {
          const existingEquipmentType = await EquipmentType.findOne({
            where: { id },
          });

          if (!existingEquipmentType)
            throw new Error("Equipment Type Not Found");

          if (locationId) {
            const existingLocation = await Location.findOne({
              where: { id: locationId },
            });
            if (!existingLocation) throw new Error("Location Not Found");
            existingEquipmentType.locationId = locationId;
            existingEquipmentType.location = existingLocation;
          }
          if (description) existingEquipmentType.description = description;
          if (name) existingEquipmentType.name = name;

          return {
            message: "Update Equipment Type successfully",
            equipmentType: await existingEquipmentType.save(),
          };
        } else {
          throw new Error(PermissionDeniedError);
        }
      } else {
        // CREATE SECTION
        if (!name)
          throw new Error("Must include name when create Equipment Type!");

        const newEquipmentType = await EquipmentType.create({
          name,
        });
        if (locationId) {
          if (
            (user?.role === USER_ROLE.Admin &&
              user?.locationId === locationId) ||
            user?.role === USER_ROLE.SuperAdmin
          ) {
            const existingLocation = await Location.findOne({
              where: { id: locationId },
            });
            if (!existingLocation) throw new Error("Location Not Found");
            newEquipmentType.locationId = locationId;
            newEquipmentType.location = existingLocation;
          } else {
            throw new Error(PermissionDeniedError);
          }
        }
        if (description) newEquipmentType.description = description;

        return {
          message: "Create Equipment Type successfully",
          equipmentType: await newEquipmentType.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
