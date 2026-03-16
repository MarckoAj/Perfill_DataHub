import moment from "moment";

class CustomDate {

  minForMilliseconds(min) {
    return min * 60 * 1000;
  }

  hoursForMilliseconds(hour) {
    return hour * this.minForMilliseconds(60)
  }

  daysForMilliseconds(day) {
    return day * this.hoursForMilliseconds(24)
  }

  calculateTimeDif(date1, date2 = moment()) {
    return moment(date1, 'YYYY-MM-DD HH:mm:ss').diff(date2)
  }

  getDate(interval) {

    let date = { startDate: "", endDate: "" };
    switch (interval) {
      case "mes":
        date.startDate = moment().startOf("month").format("YYYY-MM-DDTHH:mm:ss");
        date.endDate = moment().endOf("month").format("YYYY-MM-DDTHH:mm:ss");
        break;
      case "dia":
        date.startDate = moment().startOf("day").format("YYYY-MM-DDTHH:mm:ss");
        date.endDate = moment().endOf("day").format("YYYY-MM-DDTHH:mm:ss");
        break;
      case "ano":
        date.startDate = moment().startOf("year").format("YYYY-MM-DDTHH:mm:ss");
        date.endDate = moment().endOf("year").format("YYYY-MM-DDTHH:mm:ss");
        break;
      case "trimestre":
        date.startDate = moment().startOf("quarter").format("YYYY-MM-DDTHH:mm:ss");
        date.endDate = moment().endOf("quarter").format("YYYY-MM-DDTHH:mm:ss");
        break;
      case "projectStart":
        date.startDate = moment("2020-01-01").startOf("year").format("YYYY-MM-DDTHH:mm:ss");
        date.endDate = moment().endOf("year").format("YYYY-MM-DDTHH:mm:ss");
        break;
      default:
        console.log("Formato de data não encontrado");
    }

    return date;
  }

  calculateTimeInterval(targetDate) {
    const now = moment();
    const target = moment(targetDate, 'YYYY-MM-DD HH:mm:ss');
    const diff = target.diff(now);

    const duration = moment.duration(Math.abs(diff));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    if (diff > 0) {
      return `${days}D, ${formattedHours}H:${formattedMinutes}M`;
    } else {
      return `${days}D, ${formattedHours}H:${formattedMinutes}M ago`;
    }
  }

}


export default new CustomDate();
