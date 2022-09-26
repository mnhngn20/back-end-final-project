import { authMiddleware } from "../middlewares/auth-middleware";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import {
  UpsertReviewInput,
  ReviewResponse,
  GetReviewsInput,
  ReviewListResponse,
} from "../types/review";
import { Context } from "../types/Context";
import { Reservation, Review, Room, User } from "../entities";
import { RESERVATION_STATUS } from "../constants";
import { OutOfBoundsError, PermissionDeniedError } from "../types/Errors";

@Resolver()
export class ReviewResolver {
  @Query((_returns) => ReviewResponse)
  @UseMiddleware(authMiddleware)
  async getReview(@Arg("id") id: number): Promise<ReviewResponse> {
    try {
      const existingReview = await Review.findOne({ where: { id } });
      if (!existingReview) throw new Error("Review Not Found");

      return {
        message: "Get Review successfully",
        review: existingReview,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => ReviewListResponse)
  @UseMiddleware(authMiddleware)
  async getReviews(
    @Arg("input")
    { limit, orderBy, page, reservationId, roomId, userId }: GetReviewsInput
  ): Promise<ReviewListResponse> {
    try {
      if (roomId) {
        const existingRoom = await Room.findOne({ where: { id: roomId } });
        if (!existingRoom) throw new Error("Room Not Found");
      }
      if (userId) {
        const existingUser = await User.findOne({ where: { id: userId } });
        if (!existingUser) throw new Error("User Not Found");
      }
      if (reservationId) {
        const existingReservation = await Room.findOne({
          where: { id: reservationId },
        });
        if (!existingReservation) throw new Error("Reservation Not Found");
      }

      const options = {
        ...(roomId !== undefined && { roomId }),
        ...(reservationId !== undefined && { reservationId }),
        ...(userId !== undefined && { userId }),
      };
      const [result, total] = await Review.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["reservation", "user"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Reviews successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_type) => ReviewResponse)
  @UseMiddleware(authMiddleware)
  async upsertReview(
    @Arg("input")
    { reservationId, id, images, rate, content }: UpsertReviewInput,
    @Ctx() { user }: Context
  ): Promise<ReviewResponse> {
    try {
      const userId = user?.id;

      if ((rate && rate > 6) || (rate && rate < 1))
        throw new Error("Review's rate must be less than 5 and greater than 1");

      const existingUser = await User.findOne({ where: { id: userId } });
      if (!existingUser) throw new Error("User Not Found");

      const existingReservation = await Reservation.findOne({
        where: { id: reservationId },
      });
      if (!existingReservation) throw new Error("Reservation Not Found");

      const existingRoom = await Room.findOne({
        where: { id: existingReservation.roomId },
      });

      if (!existingRoom) throw new Error("Room Not Found");

      if (existingReservation.userId !== userId)
        throw new Error(PermissionDeniedError);

      if (id) {
        // UPDATE SECTION
        const existingReview = await Review.findOne({
          where: { id },
          relations: ["user", "room", "reservation"],
        });
        if (!existingReview) throw new Error("Review Not Found");

        if (existingReview.userId !== userId)
          throw new Error("Unable to update Review!");

        existingReview.userId = userId;
        existingReview.user = existingUser;

        if (content) existingReview.content = content;
        if (images) existingReview.images = images;
        if (rate) existingReview.rate = rate;
        existingReservation.hasReviewed = true;
        await existingReservation.save();
        return {
          message: "Update Review successfully",
          review: await existingReview.save(),
        };
      } else {
        // CREATE SECTION
        if (
          !(
            existingReservation.status === RESERVATION_STATUS.Paid &&
            +existingReservation.fromDate < +new Date()
          )
        )
          throw new Error("Unable to create Review");

        if (!rate) throw new Error("Must include rate when create review!");

        const newReview = await Review.create({
          userId,
          roomId: existingReservation.roomId,
          reservationId,
          rate,
        });

        newReview.reservation = existingReservation;
        newReview.room = existingRoom;
        newReview.user = existingUser;

        if (content) newReview.content = content;
        if (images) newReview.images = images;

        existingReservation.hasReviewed = true;
        await existingReservation.save();

        return {
          message: "Create Review successfully",
          review: await newReview.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
