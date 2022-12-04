import { createEquipmentReportIncidentCategory } from "./../utils/helper";
import { IncidentCategory } from "./../entities/IncidentCategory";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import {
  GetIncidentCategoriesInput,
  IncidentCategoryListResponse,
  IncidentCategoryResponse,
  UpsertIncidentCategoriesInput,
} from "../types/incidentCategory";
import { authMiddleware } from "../middlewares/auth-middleware";
import { Context } from "../types/Context";
import { USER_ROLE } from "../constants";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";
import { ILike } from "typeorm";

@Resolver()
export class IncidentCategoryResolver {
  @Query((_returns) => IncidentCategoryResponse)
  async getIncidentCategory(
    @Arg("id")
    id: number
  ): Promise<IncidentCategoryResponse> {
    try {
      createEquipmentReportIncidentCategory();
      const existingIncidentCategory = await IncidentCategory.findOne({
        where: { id },
      });

      if (!existingIncidentCategory)
        throw new Error("Incident category Not Found");
      return {
        message: "Get Incident Category successfully",
        incidentCategory: existingIncidentCategory,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => IncidentCategoryListResponse)
  async getIncidentCategories(
    @Arg("input")
    { limit, orderBy, page, name, isActive }: GetIncidentCategoriesInput
  ): Promise<IncidentCategoryListResponse> {
    try {
      createEquipmentReportIncidentCategory();

      const options = {
        ...(name && {
          name: ILike(`%${name}%`),
        }),
        ...(isActive !== undefined && {
          isActive,
        }),
      };

      const [result, total] = await IncidentCategory.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Incident Categories successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => IncidentCategoryResponse)
  @UseMiddleware(authMiddleware)
  async upsertIncidentCategory(
    @Arg("input")
    { id, ...rest }: UpsertIncidentCategoriesInput,
    @Ctx()
    { user: currentUser }: Context
  ): Promise<IncidentCategoryResponse> {
    if (currentUser?.role !== USER_ROLE.SuperAdmin)
      throw new Error(PermissionDeniedError);
    try {
      if (id) {
        // UPDATE SECTION
        const existingIncidentCategory = await IncidentCategory.findOne({
          where: { id },
        });

        if (!existingIncidentCategory)
          throw new Error("Incident Category Not Found");

        IncidentCategory.merge(existingIncidentCategory, { ...rest });

        return {
          message: "Update Incident Category successfully",
          incidentCategory: await existingIncidentCategory.save(),
        };
      } else {
        // CREATE SECTION
        const newIncidentCategory = await IncidentCategory.create({
          ...rest,
        });

        return {
          message: "Create Incident Category successfully",
          incidentCategory: await newIncidentCategory.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
