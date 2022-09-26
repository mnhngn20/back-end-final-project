import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { authMiddleware } from "../middlewares/auth-middleware";
import {
  GeneralSummaryResponse,
  GetGeneralReportChartInput,
  GetLocationReportChartInput,
  LocationSummaryResponse,
  ReportChart,
  ReportsResponse,
} from "../types/report";
import { Context } from "../types/Context";
import { RESERVATION_STATUS, USER_ROLE } from "../constants";
import { LocationNotFoundError, PermissionDeniedError } from "../types/Errors";
import { Location, Reservation, Room, User } from "../entities";
import { Between, MoreThanOrEqual } from "typeorm";
import moment from "moment";
import TimeHelper from "../utils/common/timeHelper";

@Resolver()
export class ReportResolver {
  @Query((_returns) => LocationSummaryResponse)
  @UseMiddleware(authMiddleware)
  async getLocationSummary(
    @Ctx() { user }: Context,
    @Arg("locationId", { nullable: true, defaultValue: null })
    locationId?: number
  ): Promise<LocationSummaryResponse> {
    try {
      if (
        user?.role === USER_ROLE.Employee ||
        user?.role === USER_ROLE.Customer
      )
        throw new Error(PermissionDeniedError);

      if (user?.role === USER_ROLE.SuperAdmin && !locationId)
        throw new Error("You must provide a locationId");

      let targetLocationId =
        user?.role === USER_ROLE.Admin ? user.locationId : locationId;

      const location = await Location.findOne({
        where: {
          id: targetLocationId,
        },
      });
      if (!location) throw new Error(LocationNotFoundError);

      const reservations = await Reservation.find({
        where: {
          locationId: targetLocationId,
          status: RESERVATION_STATUS.Paid,
        },
      });

      const rooms = await Room.find({
        where: {
          locationId: targetLocationId,
          status: true,
        },
      });

      return {
        totalReservation: reservations.length,
        totalRoom: rooms.length,
        totalIncome: location.income,
        incomePerRoom: rooms.length === 0 ? 0 : location.income / rooms.length,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  @Query((_returns) => GeneralSummaryResponse)
  @UseMiddleware(authMiddleware)
  async getGeneralSummary(
    @Ctx() { user }: Context
  ): Promise<GeneralSummaryResponse> {
    try {
      if (user?.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);

      const locations = await Location.find({
        where: { status: true },
      });

      const reservations = await Reservation.find({
        where: {
          status: RESERVATION_STATUS.Paid,
        },
      });

      const newUsers = await User.find({
        where: {
          createdAt: MoreThanOrEqual(moment().subtract(7, "days").toDate()),
          isActive: true,
        },
      });
      const customers = await User.find({
        where: { isActive: true, role: USER_ROLE.Customer },
      });
      return {
        totalReservation: reservations.length,
        totalNewUser: newUsers.length,
        totalCustomer: customers.length,
        totalLocation: locations.length,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  @Query((_returns) => ReportsResponse)
  @UseMiddleware(authMiddleware)
  async getReservationReport(
    @Ctx() { user }: Context,
    @Arg("input") { locationId, fromDate, toDate }: GetLocationReportChartInput
  ): Promise<ReportsResponse> {
    try {
      if (
        user?.role === USER_ROLE.Employee ||
        user?.role === USER_ROLE.Customer
      )
        throw new Error(PermissionDeniedError);

      let reservations: Reservation[] = [];
      if (user?.role === USER_ROLE.SuperAdmin && !locationId) {
        // get reservation report chart of all system
        reservations = await Reservation.find({
          where: {
            status: RESERVATION_STATUS.Paid,
            createdAt: Between(fromDate, toDate),
          },
        });
      } else {
        // get reservation report chart of 1 location
        const targetLocationId =
          user?.role === USER_ROLE.Admin ? user.locationId : locationId;

        const location = await Location.findOne({
          where: {
            id: targetLocationId,
          },
        });
        if (!location) throw new Error(LocationNotFoundError);

        reservations = await Reservation.find({
          where: {
            locationId: targetLocationId,
            status: RESERVATION_STATUS.Paid,
            createdAt: Between(fromDate, toDate),
          },
        });
      }

      // calculate results
      let chartData: ReportChart[] = [];
      await TimeHelper.loopByDay({
        fromDate,
        toDate,
        callback: (d: Date) => {
          chartData.push({
            date: d,
            value: 0,
          });
        },
      });
      reservations.forEach((r) => {
        chartData.forEach((c) => {
          if (
            +c.date <= +r.createdAt &&
            +r.createdAt < +TimeHelper.addDays(c.date)
          ) {
            c.value++;
          }
        });
      });

      return {
        message: "Get Chart Reports Successfully",
        items: chartData,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  @Query((_returns) => ReportsResponse)
  @UseMiddleware(authMiddleware)
  async getNewUserReport(
    @Ctx() { user }: Context,
    @Arg("input") { fromDate, toDate }: GetGeneralReportChartInput
  ): Promise<ReportsResponse> {
    try {
      if (user?.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);

      const users = await User.find({
        where: {
          isActive: true,
          createdAt: Between(fromDate, toDate),
        },
      });

      let chartData: ReportChart[] = [];
      await TimeHelper.loopByDay({
        fromDate,
        toDate,
        callback: (d: Date) => {
          chartData.push({
            date: d,
            value: 0,
          });
        },
      });
      users.forEach((u) => {
        chartData.forEach((c) => {
          if (
            +c.date <= +u.createdAt &&
            +u.createdAt < +TimeHelper.addDays(c.date)
          ) {
            c.value++;
          }
        });
      });

      return {
        message: "Get Chart Reports Successfully",
        items: chartData,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  @Query((_returns) => ReportsResponse)
  @UseMiddleware(authMiddleware)
  async getIncomeReport(
    @Ctx() { user }: Context,
    @Arg("input") { locationId, fromDate, toDate }: GetLocationReportChartInput
  ): Promise<ReportsResponse> {
    try {
      if (
        user?.role === USER_ROLE.Employee ||
        user?.role === USER_ROLE.Customer
      )
        throw new Error(PermissionDeniedError);

      if (user?.role === USER_ROLE.SuperAdmin && !locationId)
        throw new Error("You must provide a locationId");

      const targetLocationId =
        user?.role === USER_ROLE.Admin ? user.locationId : locationId;

      const location = await Location.findOne({
        where: {
          id: targetLocationId,
        },
      });
      if (!location) throw new Error(LocationNotFoundError);

      const reservations = await Reservation.find({
        where: {
          locationId: targetLocationId,
          status: RESERVATION_STATUS.Paid,
          createdAt: Between(fromDate, toDate),
        },
      });

      let chartData: ReportChart[] = [];
      await TimeHelper.loopByDay({
        fromDate,
        toDate,
        callback: (d: Date) => {
          chartData.push({
            date: d,
            value: 0,
          });
        },
      });
      reservations.forEach((r) => {
        chartData.forEach((c) => {
          if (
            +c.date <= +r.createdAt &&
            +r.createdAt < +TimeHelper.addDays(c.date)
          ) {
            c.value += r.finalPrice;
          }
        });
      });

      return {
        message: "Get Chart Reports Successfully",
        items: chartData,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
