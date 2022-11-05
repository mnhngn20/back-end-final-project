import { OutOfBoundsError } from "./../types/Errors";
import { GetNotificationsInput } from "./../types/notification/args/GetNotificationsInput";
import {
  CreateInstallationInput,
  NotificationListResponse,
} from "./../types/notification/";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Notification, User } from "../entities";
import { authMiddleware } from "../middlewares/auth-middleware";

@Resolver()
export class NotificationResolver {
  @Query((_returns) => NotificationListResponse)
  async getNotifications(
    @Arg("input")
    {
      limit,
      orderBy,
      page,
      isAdminOnly,
      locationId,
      type,
      userId,
    }: GetNotificationsInput
  ): Promise<NotificationListResponse> {
    try {
      const options = {
        ...(isAdminOnly !== null &&
          isAdminOnly !== undefined && {
            isAdminOnly,
          }),
        ...(locationId && {
          locationId,
        }),
        ...(type && {
          type,
        }),
        ...(userId && {
          userId,
        }),
      };

      const [result, total] = await Notification.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get notifications successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  // @Mutation((_returns) => AmenityResponse)
  // @UseMiddleware(authMiddleware)
  // async updateAmenityStatus(
  //   @Arg("input") { id, isActive }: UpdateAmenityStatusInput
  // ): Promise<AmenityResponse> {
  //   try {
  //     const existingAmenity = await Amenity.findOne({
  //       where: { id },
  //       relations: ["amenityType"],
  //     });

  //     if (!existingAmenity) throw new Error("Amenity Not Found");

  //     existingAmenity.isActive = isActive;
  //     return {
  //       message: "Update Amenity Status successfully",
  //       amenity: await existingAmenity.save(),
  //     };
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // }

  @Mutation((_returns) => String)
  @UseMiddleware(authMiddleware)
  async createInstallation(
    @Arg("input")
    { firebaseToken, userId }: CreateInstallationInput
  ): Promise<string> {
    try {
      const existingUser = await User.findOne({
        where: { id: userId },
      });
      if (!existingUser) throw new Error("User Not Found");

      existingUser.firebaseToken = firebaseToken;

      await existingUser.save();

      return "Success";
    } catch (error) {
      throw new Error(error);
    }
  }
}
