import {
  Location,
  Plan,
  Promotion,
  Reservation,
  Room,
  RoomType,
  User,
} from "../entities";
import { authMiddleware } from "../middlewares/auth-middleware";
import { Context } from "../types/Context";
import {
  ExpiredPromotionError,
  InternalServerError,
  LocationNotFoundError,
  NotEnoughMoneyError,
  NotHaveConditionError,
  OutOfBoundsError,
  PermissionDeniedError,
  PlanNotBelongToRoomTypeError,
  PlanNotFoundError,
  PromotionNotFoundError,
  PromotionNotStartedError,
  ReservationNotFoundError,
  RoomNotAvailableError,
  RoomNotFoundError,
  RoomTypeNotFoundError,
  UserNotFoundError,
} from "../types/Errors";
import {
  ChangeReservationStatusInput,
  CreateReservationInput,
  GetReservationsInput,
  ListReservationResponse,
  ReservationResponse,
} from "../types/reservation";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import {
  PAYMENT_METHOD,
  PROMOTION_TYPE,
  RESERVATION_STATUS,
  USER_ROLE,
} from "../constants";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import TimeHelper from "../utils/common/timeHelper";
import RentedPerDayHelper from "../utils/rentedPerDay/rentedPerDayHelper";
import NotificationHelper from "../utils/common/notificationHelper";

@Resolver()
export class ReservationResolver {
  @Query((_returns) => ReservationResponse)
  @UseMiddleware(authMiddleware)
  async getReservation(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<ReservationResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);
      const existingReservation = await Reservation.findOne({
        where: { id },
        relations: [
          "room",
          "user",
          "promotion",
          "plan",
          "review",
          "location",
          "creator",
        ],
      });
      if (!existingReservation) throw new Error(ReservationNotFoundError);
      if (
        user.role === USER_ROLE.Customer &&
        existingReservation.userId !== user.id
      )
        throw new Error(PermissionDeniedError);
      return {
        message: "Get Reservation successfully",
        reservation: existingReservation,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_return) => ListReservationResponse)
  @UseMiddleware(authMiddleware)
  async getReservations(
    @Arg("input")
    {
      page,
      limit,
      orderBy,
      paymentMethod,
      status,
      fromDate,
      hasReviewed,
      roomId,
      toDate,
      userId,
      creatorId,
    }: GetReservationsInput,
    @Ctx() { user }: Context
  ): Promise<ListReservationResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      if (userId && user.role === USER_ROLE.Customer && user.id !== userId)
        throw new Error(PermissionDeniedError);

      const targetUserId = user.role === USER_ROLE.Customer ? user.id : userId;

      let options = {
        ...(targetUserId && { userId: targetUserId }),
        ...(creatorId && { creatorId }),
        ...(roomId && { roomId }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
        ...(hasReviewed !== undefined &&
          hasReviewed !== null && { hasReviewed }),
        ...(fromDate && { fromDate: MoreThanOrEqual(fromDate) }),
        ...(toDate && { toDate: LessThanOrEqual(toDate) }),
      };

      const [result, total] = await Reservation.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: [
          "room",
          "user",
          "promotion",
          "plan",
          "review",
          "location",
          "creator",
        ],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Reservations successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_return) => ReservationResponse)
  @UseMiddleware(authMiddleware)
  async createReservation(
    @Arg("input")
    {
      userId,
      planId,
      roomId,
      promotionCode,
      fromDate,
      toDate,
      paymentMethod,
    }: CreateReservationInput,
    @Ctx() { user }: Context
  ): Promise<ReservationResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const isHelpToBook = userId && user.id !== userId;
      const targetUserId = isHelpToBook ? userId : user.id;
      const numOfDays = TimeHelper.getDayDiff(fromDate, toDate);

      // Only Employee can help customer to create new reservation
      if (isHelpToBook && user.role !== USER_ROLE.Employee)
        throw new Error(PermissionDeniedError);

      const targetUser = await User.findOne({
        where: { id: targetUserId, isActive: true },
      });
      if (!targetUser) throw new Error(UserNotFoundError);

      // Employee can create reservation for customer only
      if (isHelpToBook && targetUser.role !== USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const room = await Room.findOne({
        where: { id: roomId, status: true },
        relations: ["roomType", "location"],
      });
      if (!room) throw new Error(RoomNotFoundError);

      // Employee only can create reservation for customer in his location
      if (isHelpToBook && user.locationId !== room.locationId)
        throw new Error(PermissionDeniedError);

      const location = await Location.findOne({
        where: { id: room.locationId, status: true },
      });
      if (!location) throw new Error(LocationNotFoundError);

      const roomType = await RoomType.findOne({
        where: { id: room.roomTypeId },
      });
      if (!roomType) throw new Error(RoomTypeNotFoundError);

      const plan = await Plan.findOne({
        where: { id: planId, status: true, roomTypeId: roomType.id },
      });
      if (!plan) throw new Error(PlanNotFoundError);

      // Room doesn't include plan
      if (plan.roomTypeId !== roomType.id)
        throw new Error(PlanNotBelongToRoomTypeError);

      // reservation's number of days has to be more or equal plan's minimum number of days
      if (numOfDays < plan.numOfDays) throw new Error(NotHaveConditionError);

      if (!(await RentedPerDayHelper.checkAvailable(fromDate, toDate, room)))
        throw new Error(RoomNotAvailableError);

      const totalPrice = room.basePrice * plan.multiplicationFactor * numOfDays;
      let finalPrice = totalPrice;

      let promotion;
      if (promotionCode) {
        promotion = await Promotion.findOne({
          where: { code: promotionCode, isActive: true },
        });
        if (!promotion) throw new Error(PromotionNotFoundError);

        if (+promotion.startDate > +new Date())
          throw new Error(PromotionNotStartedError);

        if (+promotion.expirationDate < +new Date())
          throw new Error(ExpiredPromotionError);

        let discountAmount = 0;
        if (promotion.type === PROMOTION_TYPE.FixedCashDiscount) {
          discountAmount = promotion.amount;
        } else {
          discountAmount = totalPrice * promotion.amount;
        }

        finalPrice = Math.ceil(
          finalPrice > discountAmount ? finalPrice - discountAmount : 0
        );
      }

      const newReservation = Reservation.create({
        userId: targetUserId,
        planId,
        roomId,
        fromDate,
        toDate,
        promotionId: promotion?.id,
        paymentMethod,
        totalPrice,
        finalPrice,
        locationId: location.id,
        creatorId: targetUser.id !== user.id ? user.id : undefined,
      });

      newReservation.plan = plan;
      newReservation.room = room;
      newReservation.promotion = promotion;
      newReservation.location = location;
      newReservation.user = targetUser;

      await RentedPerDayHelper.increase(newReservation);

      return {
        message: "Create Reservation Successfully",
        reservation: await newReservation?.save(),
      };
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  @Mutation((_return) => String)
  @UseMiddleware(authMiddleware)
  async changeReservationStatus(
    @Arg("input")
    { id, status }: ChangeReservationStatusInput,
    @Ctx() { user }: Context
  ): Promise<String | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      // Check Reservation existed
      const targetReservation = await Reservation.findOne({
        where: { id: id },
      });
      if (!targetReservation) throw new Error(ReservationNotFoundError);

      // Only Employee can help Customer to change their reservations' status
      if (
        user.role !== USER_ROLE.Employee &&
        user.id !== targetReservation.userId
      )
        throw new Error(PermissionDeniedError);

      // Check Location existed
      const location = await Location.findOne({
        where: { id: targetReservation.locationId },
      });
      if (!location) throw new Error(LocationNotFoundError);

      // Check User existed
      const targetUser = await User.findOne({
        where: { id: targetReservation.userId },
      });
      if (!targetUser) throw new Error(UserNotFoundError);

      // Change status to paid
      if (status === RESERVATION_STATUS.Paid) {
        location.income = location.income + targetReservation.finalPrice;
        await location.save();

        if (targetReservation.paymentMethod === PAYMENT_METHOD.Paypal) {
          if (targetUser.balance < targetReservation.finalPrice)
            throw new Error(NotEnoughMoneyError);
          targetUser.balance -= targetReservation.finalPrice;
          await targetUser.save();
        }
      }

      // Reservation started
      if (
        status === RESERVATION_STATUS.Canceled &&
        +new Date() >= +targetReservation.fromDate
      )
        throw new Error(NotHaveConditionError);

      // Change status to unpaid/canceled
      if (
        status !== RESERVATION_STATUS.Paid &&
        targetReservation.status === RESERVATION_STATUS.Paid
      ) {
        location.income = location.income - targetReservation.finalPrice;
        await location.save();

        if (targetReservation.paymentMethod === PAYMENT_METHOD.Paypal) {
          targetUser.balance += targetReservation.finalPrice;
          await targetUser.save();
        }
      }
      if (status === RESERVATION_STATUS.Canceled)
        await RentedPerDayHelper.decrease(targetReservation);

      if (targetUser.firebaseToken) {
        const getStatusText = (value: RESERVATION_STATUS) =>
          value === RESERVATION_STATUS.Paid
            ? "Paid"
            : value === RESERVATION_STATUS.Canceled
            ? "Canceled"
            : "Unpaid";
        NotificationHelper.sendToDevice(targetUser.firebaseToken, {
          notification: {
            title: "CBS Notifier",
            body: `Reservation status change from ${getStatusText(
              targetReservation.status
            )} to ${getStatusText(status)}`,
          },
          data: {
            reservationId: `${targetReservation.id}`,
          },
        });
      }

      targetReservation.status = status;
      await targetReservation?.save();

      return "Change Reservation Status Successfully";
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }
}
