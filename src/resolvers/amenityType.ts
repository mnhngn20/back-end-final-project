import { GetAmenityTypesInput } from "./../types/amenityType/args/GetAmenityTypesInput";
import { AmenityTypeListResponse } from "./../types/amenityType/reponses/AmenityTypeListResponse";
import { AmenityTypeResponse } from "./../types/amenityType/reponses/AmenityTypeResponse";
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
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { AmenityType } from "../entities";
import { ILike } from "typeorm";
import { UpsertAmenityTypeInput } from "./../types/amenityType/args/UpsertAmenityTypeInput";

@Resolver()
export class AmenityTypeResolver {
  @Query((_returns) => AmenityTypeResponse)
  async getAmenityType(
    @Arg("id")
    id: number
  ): Promise<AmenityTypeResponse> {
    try {
      const existingAmenityType = await AmenityType.findOne({
        where: { id },
      });

      if (!existingAmenityType) throw new Error("Amenity Type Not Found");
      return {
        message: "Get Amenity Type successfully",
        amenityType: existingAmenityType,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => AmenityTypeListResponse)
  async getAmenityTypes(
    @Arg("input")
    { limit, orderBy, page, name, isActive }: GetAmenityTypesInput
  ): Promise<AmenityTypeListResponse> {
    try {
      const options = {
        ...(name && {
          name: ILike(`%${name}%`),
        }),
        ...(isActive !== undefined && {
          isActive,
        }),
      };

      const [result, total] = await AmenityType.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Amenity Types successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => AmenityTypeResponse)
  @UseMiddleware(authMiddleware)
  async upsertAmenityType(
    @Arg("input")
    { id, ...rest }: UpsertAmenityTypeInput,
    @Ctx()
    { user: currentUser }: Context
  ): Promise<AmenityTypeResponse> {
    if (currentUser?.role !== USER_ROLE.SuperAdmin)
      throw new Error(PermissionDeniedError);
    try {
      if (id) {
        // UPDATE SECTION
        const existingAmenityType = await AmenityType.findOne({
          where: { id },
        });

        if (!existingAmenityType) throw new Error("Amenity Type Not Found");

        AmenityType.merge(existingAmenityType, { ...rest });

        return {
          message: "Update Amenity Type successfully",
          amenityType: await existingAmenityType.save(),
        };
      } else {
        // CREATE SECTION
        const newAmenityType = await AmenityType.create({
          ...rest,
        });

        return {
          message: "Create Amenity Type successfully",
          amenityType: await newAmenityType.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
