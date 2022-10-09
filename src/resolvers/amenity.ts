import { Location } from "./../entities/Location";
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
  AmenityListResponse,
  AmenityResponse,
  GetAmenitiesInput,
  UpdateAmenityStatusInput,
  UpsertAmenityInput,
} from "../types/amenity";
import { AmenityType, Amenity } from "../entities";
import { InternalServerError, OutOfBoundsError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ILike } from "typeorm";

@Resolver()
export class AmenityResolver {
  @Query((_returns) => AmenityResponse)
  @UseMiddleware(authMiddleware)
  async getAmenity(@Arg("id") id: number): Promise<AmenityResponse> {
    try {
      const existingAmenity = await Amenity.findOne({
        where: { id },
        relations: ["location", "amenityType"],
      });

      if (!existingAmenity) throw new Error("Amenity Not Found");

      return {
        message: "Get Amenity successfully",
        amenity: existingAmenity,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => AmenityListResponse)
  @UseMiddleware(authMiddleware)
  async getAmenities(
    @Arg("input")
    { limit, page, orderBy, name, isActive, amenityTypeId }: GetAmenitiesInput,
    @Ctx() { user }: Context
  ): Promise<AmenityListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      let options = {
        ...(name && { name: ILike(`%${name}%`) }),
        ...(isActive !== undefined && isActive !== null && { isActive }),
        ...(amenityTypeId && { amenityTypeId }),
      };

      const [result, total] = await Amenity.findAndCount({
        order: { createdAt: orderBy },
        take: limit,
        where: options,
        skip: (page - 1) * limit,
        relations: ["location", "amenityType"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Amenities successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => AmenityResponse)
  @UseMiddleware(authMiddleware)
  async updateAmenityStatus(
    @Arg("input") { id, isActive }: UpdateAmenityStatusInput
  ): Promise<AmenityResponse> {
    try {
      const existingAmenity = await Amenity.findOne({
        where: { id },
        relations: ["amenityType"],
      });

      if (!existingAmenity) throw new Error("Amenity Not Found");

      existingAmenity.isActive = isActive;
      return {
        message: "Update Amenity Status successfully",
        amenity: await existingAmenity.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => AmenityResponse)
  @UseMiddleware(authMiddleware)
  async upsertAmenity(
    @Arg("input")
    { id, amenityTypeId, locationId, ...rest }: UpsertAmenityInput
  ): Promise<AmenityResponse> {
    try {
      const existingAmenityType = await AmenityType.findOne({
        where: { id: amenityTypeId },
      });
      if (!existingAmenityType) throw new Error("Amenity Type Not Found");

      if (id) {
        // UPDATE SECTION
        const existingAmenity = await Amenity.findOne({ where: { id } });
        if (!existingAmenity) throw new Error("Amenity Not Found");

        Amenity.merge(existingAmenity, {
          ...rest,
          amenityTypeId,
        });

        return {
          message: "Update Amenity successfully",
          amenity: await existingAmenity.save(),
        };
      } else {
        // CREATE SECTION
        if (!locationId) {
          throw new Error("Must include locationId");
        }

        const existingLocation = await Location.findOne({
          where: { id: locationId },
        });

        if (!existingLocation) {
          throw new Error("Location Not Found");
        }

        const newAmenity = await Amenity.create({
          ...rest,
          amenityTypeId,
          locationId,
        });

        return {
          message: "Create Amenity successfully",
          amenity: await newAmenity.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
