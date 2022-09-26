import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { authMiddleware } from "../middlewares/auth-middleware";
import {
  GetPromotionsInput,
  PromotionListResponse,
  PromotionResponse,
  UpdatePromotionStatusInput,
  UpsertPromotionInput,
} from "../types/promotion";
import { Promotion } from "../entities/Promotion";
import { IsNull, LessThanOrEqual, Like, MoreThanOrEqual } from "typeorm";
import { Context } from "../types/Context";
import { USER_ROLE } from "../constants";
import {
  InternalServerError,
  InvalidInputError,
  OutOfBoundsError,
  PermissionDeniedError,
  PromotionNotFoundError,
} from "../types/Errors";

@Resolver()
export class PromotionResolver {
  @Query((_returns) => PromotionResponse)
  @UseMiddleware(authMiddleware)
  async getPromotion(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<PromotionResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      const existingPromotion = await Promotion.findOne({
        where: { id },
        relations: ["location"],
      });
      if (!existingPromotion) throw new Error(PromotionNotFoundError);
      return {
        message: "Get Promotion successfully",
        promotion: existingPromotion,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => PromotionListResponse)
  @UseMiddleware(authMiddleware)
  async getPromotions(
    @Arg("input")
    {
      code,
      type,
      locationId,
      startDate,
      expirationDate,
      limit,
      orderBy,
      page,
    }: GetPromotionsInput,
    @Ctx() { user }: Context
  ): Promise<PromotionListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      let options;

      if (user?.role === USER_ROLE.Admin || user?.role === USER_ROLE.Employee) {
        options = [
          {
            ...(code && { code: Like(`%${code}%`) }),
            ...(type && { type }),
            ...(startDate && { startDate: LessThanOrEqual(startDate) }),
            ...(expirationDate && {
              expirationDate: MoreThanOrEqual(expirationDate),
            }),
            locationId: IsNull(),
          },
          {
            ...(code && { code: Like(`%${code}%`) }),
            ...(type && { type }),
            ...(startDate && { startDate: LessThanOrEqual(startDate) }),
            ...(expirationDate && {
              expirationDate: MoreThanOrEqual(expirationDate),
            }),
            locationId: user?.locationId,
          },
        ];
      } else if (
        user?.role === USER_ROLE.SuperAdmin ||
        user?.role === USER_ROLE.Customer
      ) {
        options = {
          ...(code && { code: Like(`%${code}%`) }),
          ...(type && { type }),
          ...(startDate && { startDate: LessThanOrEqual(startDate) }),
          ...(expirationDate && {
            expirationDate: MoreThanOrEqual(expirationDate),
          }),
          ...(locationId !== undefined && {
            locationId: locationId ?? IsNull(),
          }),
        };
      }
      const [result, total] = await Promotion.findAndCount({
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
        message: "Get Promotions successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_return) => PromotionResponse)
  @UseMiddleware(authMiddleware)
  async updatePromotionStatus(
    @Arg("input")
    { id, status }: UpdatePromotionStatusInput,
    @Ctx()
    { user }: Context
  ): Promise<PromotionResponse> {
    if (
      user?.role !== USER_ROLE.Customer &&
      user?.role !== USER_ROLE.Employee
    ) {
      const existingPromotion = await Promotion.findOne({
        where: {
          id,
        },
      });
      if (!existingPromotion) throw new Error("Promotion not found");
      if (
        user?.role === USER_ROLE.Admin &&
        user?.locationId !== existingPromotion?.locationId
      )
        throw new Error(PermissionDeniedError);

      existingPromotion.isActive = status;

      return {
        message: "Update Promotion status successfully!",
        promotion: await existingPromotion.save(),
      };
    } else throw new Error(PermissionDeniedError);
  }

  @Mutation((_returns) => PromotionResponse)
  @UseMiddleware(authMiddleware)
  async upsertPromotion(
    @Arg("input")
    {
      id,
      locationId,
      code,
      type,
      amount,
      description,
      isActive,
      startDate,
      expirationDate,
    }: UpsertPromotionInput,
    @Ctx() { user }: Context
  ): Promise<PromotionResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      if (amount && amount <= 0) throw new Error(InvalidInputError);
      if (id) {
        // UPDATE Promotion
        if (
          (user?.role === USER_ROLE.Admin && user.locationId === locationId) ||
          user?.role === USER_ROLE.SuperAdmin
        ) {
          const existingPromotion = await Promotion.findOne({ where: { id } });
          if (!existingPromotion) throw new Error(PromotionNotFoundError);

          if (locationId !== undefined)
            existingPromotion.locationId = locationId;
          if (code) {
            const checkCode = await Promotion.findOne({
              where: {
                code,
              },
            });
            if (checkCode?.id !== id) throw new Error("Code is already exist!");
            existingPromotion.code = code;
          }
          if (type) existingPromotion.type = type;
          if (amount) existingPromotion.amount = amount;
          if (description) existingPromotion.description = description;
          if (isActive !== null && isActive !== undefined)
            existingPromotion.isActive = isActive;
          if (startDate) existingPromotion.startDate = startDate;
          if (expirationDate) existingPromotion.expirationDate = expirationDate;

          return {
            message: "Update Promotion successfully",
            promotion: await existingPromotion.save(),
          };
        } else {
          throw new Error(PermissionDeniedError);
        }
      } else {
        // CREATE Promotion
        if (
          (user?.role === USER_ROLE.Admin && user.locationId === locationId) ||
          user?.role === USER_ROLE.SuperAdmin
        ) {
          const checkCode = await Promotion.findOne({
            where: {
              code,
            },
          });
          if (checkCode) throw new Error("Code is already exist!");
          const newPromotion = await Promotion.create({
            locationId,
            code,
            type,
            amount,
            description,
            isActive,
            startDate,
            expirationDate,
          });
          return {
            message: "Create Promotion successfully",
            promotion: await newPromotion.save(),
          };
        } else {
          throw new Error(PermissionDeniedError);
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
