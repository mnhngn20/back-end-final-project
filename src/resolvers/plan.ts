import { USER_ROLE } from "../constants";
import { authMiddleware } from "../middlewares/auth-middleware";
import { Context } from "../types/Context";
import {
  InternalServerError,
  PermissionDeniedError,
  PlanNotFoundError,
  RoomTypeNotFoundError,
} from "../types/Errors";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { PlanListResponse, PlanResponse, UpsertPlanInput } from "../types/plan";
import { Plan, RoomType } from "../entities";

@Resolver()
export class PlanResolver {
  @Query((_returns) => PlanResponse)
  @UseMiddleware(authMiddleware)
  async getPlan(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<PlanResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      const existingPlan = await Plan.findOne({
        where: { id },
        relations: ["roomType"],
      });
      if (!existingPlan) throw new Error(PlanNotFoundError);
      return {
        message: "Get Plan successfully",
        plan: existingPlan,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => PlanListResponse)
  @UseMiddleware(authMiddleware)
  async getPlans(
    @Arg("roomTypeId", { nullable: true })
    roomTypeId: number,
    @Ctx() { user }: Context
  ): Promise<PlanListResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const result = await Plan.find({
        where: { ...(roomTypeId && { roomTypeId }) },
        relations: ["roomType"],
      });

      return {
        message: "Get Plans successfully",
        items: result,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => PlanResponse)
  @UseMiddleware(authMiddleware)
  async upsertPlan(
    @Arg("input")
    {
      id,
      roomTypeId,
      name,
      description,
      multiplicationFactor,
      numOfDays,
      status,
    }: UpsertPlanInput,
    @Ctx() { user }: Context
  ): Promise<PlanResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      if (user?.role !== USER_ROLE.Admin && user?.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);
      let plan;
      if (id) {
        // UPDATE Plan

        plan = await Plan.findOne({
          where: { id },
          relations: ["roomType"],
        });
        if (!plan) throw new Error(PlanNotFoundError);

        if (
          user.role === USER_ROLE.Admin &&
          plan.roomType?.locationId !== user.locationId
        )
          throw new Error(PermissionDeniedError);

        if (name) plan.name = name;
        if (description) plan.description = description;
        if (multiplicationFactor)
          plan.multiplicationFactor = multiplicationFactor;
        if (numOfDays) plan.numOfDays = numOfDays;
        if (status !== undefined && status !== null) plan.status = status;
      } else {
        // CREATE Plan
        const roomType = await RoomType.findOne({ where: { id: roomTypeId } });
        if (!roomType) throw new Error(RoomTypeNotFoundError);

        if (
          user?.role === USER_ROLE.Admin &&
          user.locationId !== roomType.locationId &&
          roomType.locationId
        )
          throw new Error(PermissionDeniedError);
        plan = await Plan.create({
          roomTypeId,
          name,
          description,
          multiplicationFactor,
          numOfDays,
          roomType,
        });
      }

      return {
        message: "Upsert Plan successfully",
        plan: await plan.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
