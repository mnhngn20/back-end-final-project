import { RentedPerDayByRoom, Reservation, Room } from "../../entities";
import TimeHelper from "../common/timeHelper";

export default class RentedPerDayHelper {
  static increase = async (reservation: Reservation) => {
    let promises: Promise<void>[] = [];
    await TimeHelper.loopByDay({
      fromDate: reservation.fromDate,
      toDate: reservation.toDate,
      callback: async (d: Date) => {
        promises.push(
          new Promise(async (resolve) => {
            let rentedPerDay = await RentedPerDayByRoom.findOne({
              where: {
                date: d,
                roomId: reservation.roomId,
              },
            });
            if (!rentedPerDay) {
              rentedPerDay = await RentedPerDayByRoom.create({
                date: d,
                roomId: reservation.roomId,
                numOfRentals: 1,
              });
            } else {
              rentedPerDay.numOfRentals = rentedPerDay.numOfRentals + 1;
            }

            await rentedPerDay.save();
            resolve();
          })
        );
      },
    });
    await Promise.allSettled(promises);
  };
  static decrease = async (reservation: Reservation) => {
    let promises: Promise<void>[] = [];
    await TimeHelper.loopByDay({
      fromDate: reservation.fromDate,
      toDate: reservation.toDate,
      callback: async (d: Date) => {
        promises.push(
          new Promise(async (resolve) => {
            let rentedPerDay = await RentedPerDayByRoom.findOne({
              where: {
                date: d,
                roomId: reservation.roomId,
              },
            });
            if (!rentedPerDay) {
              rentedPerDay = await RentedPerDayByRoom.create({
                date: d,
                roomId: reservation.roomId,
                numOfRentals: 0,
              });
            } else {
              rentedPerDay.numOfRentals =
                rentedPerDay.numOfRentals <= 0
                  ? 0
                  : rentedPerDay.numOfRentals - 1;
            }

            await rentedPerDay.save();
            resolve();
          })
        );
      },
    });
    await Promise.allSettled(promises);
  };
  static checkAvailable = async (fromDate: Date, toDate: Date, room: Room) => {
    let promises: Promise<void>[] = [];
    await TimeHelper.loopByDay({
      fromDate,
      toDate,
      callback: async (d: Date) => {
        promises.push(
          new Promise(async (resolve, reject) => {
            let rentedPerDay = await RentedPerDayByRoom.findOne({
              where: {
                date: d,
                roomId: room.id,
              },
            });
            if (rentedPerDay) {
              if (rentedPerDay.numOfRentals === room.capacity) reject();
            }
            resolve();
          })
        );
      },
    });
    const results = await Promise.allSettled(promises);
    return !results.some((e) => e.status === "rejected");
  };
}
