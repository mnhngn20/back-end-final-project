export default class TimeHelper {
  static getDayDiff = (startDate: Date, endDate: Date): number => {
    const msInDay = 24 * 60 * 60 * 1000;

    return (
      Math.floor(Math.abs(Number(endDate) - Number(startDate)) / msInDay) + 1
    );
  };

  static addDays = (day: Date, numOfDays: number = 1): Date => {
    return new Date(day.getTime() + numOfDays * 1000 * 60 * 60 * 24);
  };

  static loopByDay = async ({
    fromDate,
    toDate,
    callback,
    doAwait = false,
  }: LoopByDayParams): Promise<void> => {
    for (let d = new Date(+fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      if (doAwait) {
        await callback(new Date(+d));
      } else {
        callback(new Date(+d));
      }
    }
  };
}

interface LoopByDayParams {
  fromDate: Date;
  toDate: Date;
  callback: Function;
  doAwait?: boolean;
}
