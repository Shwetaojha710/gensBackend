const { Op } = require("sequelize");
const attendance = require("../../models/attendance");
const empPersonal = require("../../models/empPersonal");
const moment = require("moment");
const Shift = require("../../models/shift");
const Helper = require("../../helper/helper");
const attendanceSetting = require("../../models/attendanceSetting");
const leave_application = require("../../models/leave_application");
const Basic = require("../../models/basic");
const leave_balance = require("../../models/leaveBalance");
const holiday = require("../../models/holiday");

// exports.calculateAttendance = async (req, res) => {
//     const { employeeId, month, year, totalCTC } = req.body;
//     const tenantId = req.users && req.users.tenantId;
//     const perMonthSalary = totalCTC / 12;

//     const GRACE_MINUTES = 15;
//     const HALF_DAY_THRESHOLD = 4; // in hours
//     const HALF_DAY_CUTOFF_MINUTES = 45; // a
//     const lateAllowanceMin = 3

//     if (!tenantId || !employeeId) {
//         return Helper.response(false, "TenantId and employeeId required", [], res, 400);
//     }

//     try {
//         const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf('month');
//         const endDate = moment(startDate).endOf('month');

//         const workingDays = [];
//         let dynamicWorkingDays = 0;

//         for (let d = moment(startDate); d <= endDate; d.add(1, 'days')) {
//             if (d.day() === 0) continue; // Skip Sundays

//             const shift = await Shift.findOne({
//                 where: {
//                     day_of_week: d.format('dddd'),
//                     status: 'active',
//                     tenantId
//                 },
//                 raw: true
//             });

//             if (!shift || shift.is_week_off) continue;

//             workingDays.push(d.clone());
//             dynamicWorkingDays++;
//         }

//         console.log("Working Days:", workingDays.map(d => d.format("YYYY-MM-DD")));

//         let fullDays = 0;
//         let halfDays = 0;
//         let lateDays = 0;
//         let graceLateCount = 0;
//         let absentDays = 0;

//         for (let date of workingDays) {
//             const day_of_week = date.format('dddd');

//             const shift = await Shift.findOne({
//                 where: {
//                     day_of_week,
//                     status: 'active',
//                     tenantId
//                 },
//                 raw: true
//             });

//             if (!shift || shift.is_week_off) continue;

//             console.log(date.format("YYYY-MM-DD HH:mm:ss"), 'ffffffff')

//             const startOfDayUTC = date.format("YYYY-MM-DD 00:00:00");

//             const endOfDayUTC = date.format("YYYY-MM-DD 23:59:59");

//             const attendances = await attendance.findOne({
//                 where: {
//                     employeeId,
//                     check_in_time: {
//                         [Op.between]: [startOfDayUTC, endOfDayUTC],
//                     }
//                 },
//                 raw: true
//             });

//             if (!attendances || !attendances.check_in_time || !attendances.check_out_time) {
//                 console.warn("Invalid or missing attendance for date", date.format("YYYY-MM-DD"), attendances);
//                 absentDays++;
//                 continue;
//             }

//             const shiftStart = moment(`${date.format("YYYY-MM-DD")} ${shift.startTime}`, "YYYY-MM-DD HH:mm:ss");
//             const checkIn = moment(attendances.check_in_time);
//             const checkOut = moment(attendances.check_out_time);
//             const workedHours = moment.duration(checkOut.diff(checkIn)).asHours();
//             const rawLateByMinutes = Math.floor(moment.duration(checkIn.diff(shiftStart)).asMinutes());

//             const graceTime = shiftStart.clone().add(GRACE_MINUTES, 'minutes');
//             const halfDayTime = shiftStart.clone().add(HALF_DAY_CUTOFF_MINUTES, 'minutes');

//             if (workedHours < HALF_DAY_THRESHOLD) {
//                 absentDays++;
//                 continue;
//             }
//             // After 09:45 → always half-day
//             if (checkIn.isAfter(halfDayTime)) {
//                 halfDays++;
//             } else if (checkIn.isAfter(graceTime)) {
//                 // After 09:15 but before 09:45
//                 lateDays++;
//                 if (graceLateCount < lateAllowanceMin) {
//                     graceLateCount++;
//                     fullDays++;
//                 } else {
//                     halfDays++;
//                 }
//             } else {
//                 // On or before 09:15
//                 if (workedHours < parseFloat(shift.workingHours)) {
//                     halfDays++;
//                 } else {
//                     fullDays++;
//                 }
//             }
//         }

//         const perDaySalary = perMonthSalary / dynamicWorkingDays;
//         const basePay = (fullDays * perDaySalary) + (halfDays * perDaySalary * 0.5);

//         return Helper.response(true, "Attendance summary", {
//             employeeId,
//             month,
//             year,
//             fullDays,
//             halfDays,
//             lateDays,
//             graceLateUsed: graceLateCount,
//             absentDays,
//             totalWorkingDays: dynamicWorkingDays,
//             basePay: basePay.toFixed(2)
//         }, res, 200);

//     } catch (error) {
//         console.error("Attendance calculation error:", error);
//         return Helper.response(false, "Internal Server Error", [], res, 500);
//     }
// };

// exports.calculateAttendance = async (req, res) => {
//     const { employeeId, month, year, totalCTC } = req.body;
//     const tenantId = req.users && req.users.tenantId;

//     const deduction = await attendanceSetting.findOne({ where: { tenantId } });
//     const GRACE_MINUTES = deduction.lateAllowanceMin;
//     const HALF_DAY_THRESHOLD = deduction.halfdayToAbsentMin; // in hours
//     const HALF_DAY_CUTOFF_MINUTES = deduction.halfDayThreshold; // in minutes
//     const lateAllowanceMin = deduction.lateAllowanceMin;

//     if (!tenantId || !employeeId) {
//         return Helper.response(false, "TenantId and employeeId required", [], res, 400);
//     }

//     try {
//         const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf('month');
//         const endDate = moment(startDate).endOf('month');

//         const totalDaysInMonth = endDate.date(); //
//         const perMonthSalary = totalCTC / 12;
//         // base salary for 31 days, not only working
//         const perDaySalary = perMonthSalary / totalDaysInMonth;

//         const workingDays = [];
//         let dynamicWorkingDays = 0;

//         for (let d = moment(startDate); d <= endDate; d.add(1, 'days')) {
//             const dayName = d.format('dddd');

//             const shift = await Shift.findOne({
//                 where: {
//                     day_of_week: dayName,
//                     status: 'active',
//                     tenantId
//                 },
//                 raw: true
//             });

//             // Even if shift is week off, we count the day to track attendance for pay
//             workingDays.push({ date: d.clone(), shift });
//             dynamicWorkingDays++; // Total calendar days for attendance scan
//         }

//         let fullDays = 0;
//         let halfDays = 0;
//         let lateDays = 0;
//         let graceLateCount = 0;
//         let absentDays = 0;

//         for (let entry of workingDays) {
//             const date = entry.date;
//             const shift = entry.shift;

//             const dayStr = date.format("YYYY-MM-DD");

//             const startOfDayUTC = dayStr + " 00:00:00";
//             const endOfDayUTC = dayStr + " 23:59:59";

//             if (!shift || shift.is_week_off) {
//                 fullDays++; // Treat week-offs as paid by default
//                 continue;
//             }

//             const attendances = await attendance.findOne({
//                 where: {
//                     employeeId,
//                     check_in_time: {
//                         [Op.between]: [startOfDayUTC, endOfDayUTC],
//                     }
//                 },
//                 raw: true
//             });

//             if (!attendances || !attendances.check_in_time || !attendances.check_out_time) {
//                 absentDays++;
//                 continue;
//             }

//             const shiftStart = moment(`${dayStr} ${shift.startTime}`, "YYYY-MM-DD HH:mm:ss");
//             const checkIn = moment(attendances.check_in_time);
//             const checkOut = moment(attendances.check_out_time);
//             const workedHours = moment.duration(checkOut.diff(checkIn)).asHours();
//             const graceTime = shiftStart.clone().add(GRACE_MINUTES, 'minutes');
//             const halfDayTime = shiftStart.clone().add(HALF_DAY_CUTOFF_MINUTES, 'minutes');

//             if (workedHours < HALF_DAY_THRESHOLD) {
//                 absentDays++;
//                 continue;
//             }

//             if (checkIn.isAfter(halfDayTime)) {
//                 halfDays++;
//             } else if (checkIn.isAfter(graceTime)) {
//                 lateDays++;
//                 if (graceLateCount < lateAllowanceMin) {
//                     graceLateCount++;
//                     fullDays++;
//                 } else {
//                     halfDays++;
//                 }
//             } else {
//                 if (workedHours < parseFloat(shift.workingHours)) {
//                     halfDays++;
//                 } else {
//                     fullDays++;
//                 }
//             }
//         }

//         const basePay = (fullDays * perDaySalary) + (halfDays * perDaySalary * 0.5);

//         return Helper.response(true, "Attendance summary", {
//             employeeId,
//             month,
//             year,
//             fullDays,
//             halfDays,
//             lateDays,
//             graceLateUsed: graceLateCount,
//             absentDays,
//             totalWorkingDays: dynamicWorkingDays,
//             totalDaysInMonth,
//             perDaySalary: perDaySalary.toFixed(2),
//             basePay: basePay.toFixed(2)
//         }, res, 200);

//     } catch (error) {
//         console.error("Attendance calculation error:", error);
//         return Helper.response(false, "Internal Server Error", [], res, 500);
//     }
// };

exports.calculateAttendance = async (req, res) => {
  const { employeeId, month, year } = req.body;
  const tenantId = req.users && req.users.tenantId;
  let leavebalance;
    let data = [];
  if (!tenantId || !employeeId) {
    return Helper.response(
      false,
      "TenantId and employeeId required",
      [],
      res,
      400
    );
  }

  try {

    const checkshift = await Shift.findAll({
      where: {
        tenantId,
      },
    });
    if (!checkshift) {
      return Helper.response(false, "Create Shift First", [], res, 400);
    }
    // Attendance setting
    const deduction = await attendanceSetting.findOne({ where: { tenantId } });
    const GRACE_MINUTES = deduction.graceMinutes;
    const HALF_DAY_THRESHOLD = deduction.halfdayToAbsentMin; // hours
    const HALF_DAY_CUTOFF_MINUTES = deduction.halfDayThreshold; // minutes
    const lateAllowanceMin = deduction.lateAllowanceMin;
    for(let i=0;i<employeeId.length;i++){
    const CtcValue = await Basic.findOne({
      where: {
        tenantId,
        employeeId: employeeId[i],
        dependent: "CTC",
        status: "active",
      },
    });
    if (!CtcValue) {
      return Helper.response(false, "Add Salary Component First", [], res, 400);
    }
    const PersonalInfo = await empPersonal.findOne({
      where: {
        id: employeeId[i],
      },
    });
    const totalCTC = CtcValue?.amount;
    // Dates
    const startDate = moment(
      `${year}-${String(month).padStart(2, "0")}-01`,
      "YYYY-MM-DD"
    ).startOf("month");
    const endDate = moment(startDate).endOf("month");
    const totalDaysInMonth = endDate.date();
    const perMonthSalary = totalCTC / 12;
    const perDaySalary = perMonthSalary / totalDaysInMonth;

    // Approved Leaves Map
    let leaveRecords = await leave_application.findAll({
      where: {
        employeeId: employeeId[i],
        status: "approved",
        [Op.or]: [
          {
            fromDate: {
              [Op.between]: [
                startDate.format("YYYY-MM-DD"),
                endDate.format("YYYY-MM-DD"),
              ],
            },
          },
          {
            toDate: {
              [Op.between]: [
                startDate.format("YYYY-MM-DD"),
                endDate.format("YYYY-MM-DD"),
              ],
            },
          },
          {
            fromDate: { [Op.lte]: startDate.format("YYYY-MM-DD") },
            toDate: { [Op.gte]: endDate.format("YYYY-MM-DD") },
          },
        ],
      },
      raw: true,
    });
    leavebalance = await leave_balance.findAll({
      where: {
        employeeId: employeeId[i],
        tenantId,
        year,
      },
      raw: true,
    });
  

    // Collect all holidays for tenant
    const holidayList = await holiday.findAll({
      where: {
        tenantId,
        date: {
          [Op.between]: [
            startDate.format("YYYY-MM-DD"),
            endDate.format("YYYY-MM-DD"),
          ],
        },
      },
      raw: true,
    });
    const holidays = holidayList.map((h) => h.date);

    // Apply sandwich rule
    let applysandwitchleave = Helper.applySandwichRule(
      leaveRecords,
      holidays,
      startDate,
      endDate
    );
      const leaveDateMap1 = {};
    for (const leave of applysandwitchleave) {
      const leaveStart = moment(leave.fromDate);
      const leaveEnd = moment(leave.toDate);
      for (let d = moment(leaveStart); d <= leaveEnd; d.add(1, "days")) {
        const dateKey = d.format("YYYY-MM-DD");
        leaveDateMap1[dateKey] = leave.duration_type || "full"; // full, first_half, second_half
      }
    }

    leaveRecords = adjustLeaveRecords(leavebalance, applysandwitchleave);
    const leaveDateMap = {};
    for (const leave of leaveRecords) {
      const leaveStart = moment(leave.fromDate);
      const leaveEnd = moment(leave.toDate);
      for (let d = moment(leaveStart); d <= leaveEnd; d.add(1, "days")) {
        const dateKey = d.format("YYYY-MM-DD");
        leaveDateMap[dateKey] = leave.duration_type || "full"; // full, first_half, second_half
      }
    }

    // Collect working days with shifts
    const workingDays = [];
    let dynamicWorkingDays = 0;

    for (let d = moment(startDate); d <= endDate; d.add(1, "days")) {
      const dayName = d.format("dddd");
      const shift = await Shift.findOne({
        where: {
          day_of_week: dayName,
          status: "active",
          tenantId,
        },
        raw: true,
      });

      workingDays.push({ date: d.clone(), shift });
      dynamicWorkingDays++;
    }

    let fullDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let graceLateCount = 0;
    let absentDays = 0;

    for (let entry of workingDays) {
      const date = entry.date;
      const shift = entry.shift;
      const dayStr = date.format("YYYY-MM-DD");

      const startOfDayUTC = `${dayStr} 00:00:00`;
      const endOfDayUTC = `${dayStr} 23:59:59`;

      // if (!shift || shift.is_week_off) {
      //     fullDays++;
      //     continue;
      // }
      if (!shift || shift.is_week_off) {
        fullDays++;
        continue;
      }

      const attendances = await attendance.findOne({
        where: {
          employeeId,
          check_in_time: {
            [Op.between]: [startOfDayUTC, endOfDayUTC],
          },
        },
        raw: true,
      });

      if (
        !attendances ||
        !attendances.check_in_time ||
        !attendances.check_out_time
      ) {
        const leaveType = leaveDateMap[dayStr];
        const holidaydata = await holiday.findOne({
          where: {
            tenantId,
            date: dayStr,
          },
          raw: true,
        });

        if (leaveType == "full") {  
          // fullDays++;
          absentDays++;
        } else if (leaveType === "first_half" || leaveType === "second_half") {
          halfDays++;
        } 
        else if (holidaydata) {
          fullDays++;
        } 
        else {
          absentDays++;
        }
        continue;
      }

      const shiftStart = moment(
        `${dayStr} ${shift.startTime}`,
        "YYYY-MM-DD HH:mm:ss"
      );
      const checkIn = moment(attendances.check_in_time);
      const checkOut = moment(attendances.check_out_time);
      const workedHours = moment.duration(checkOut.diff(checkIn)).asHours();
      const graceTime = shiftStart.clone().add(GRACE_MINUTES, "minutes");
      const halfDayTime = shiftStart
        .clone()
        .add(HALF_DAY_CUTOFF_MINUTES, "minutes");

      if (workedHours < HALF_DAY_THRESHOLD) {
        absentDays++;
        continue;
      }

      if (checkIn.isAfter(halfDayTime)) {
        halfDays++;
      } else if (checkIn.isAfter(graceTime)) {
        lateDays++;
        if (graceLateCount < lateAllowanceMin) {
          graceLateCount++;
          fullDays++;
        } else {
          halfDays++;
        }
      } else {
        if (workedHours < parseFloat(shift.workingHours)) {
          halfDays++;
        } else {
          fullDays++;
        }
      }
    }

    const totalLeaveDays = Object.values(leaveDateMap1).reduce((acc, type) => {
      return acc + (type === "full" ? 1 : 0.5);
    }, 0);

    const basePay = fullDays * perDaySalary + halfDays * perDaySalary * 0.5;
    const allowedLeave = leavebalance.reduce((acc, remainingLeaves) => {
      return acc + Number(remainingLeaves.remainingLeaves);
    }, 0);
  
    data.push({
      employeeId:employeeId[i],
      employeeName: `${PersonalInfo?.firstName} ${PersonalInfo?.lastName}`,
      empCode:PersonalInfo?.empCode,
      month,
      year,
      fullDays,
      halfDays,
      lateDays,
      graceLateUsed: graceLateCount,
      absentDays,
      allowedLeave,
      totalWorkingDays: dynamicWorkingDays,
      totalDaysInMonth,
      perDaySalary: perDaySalary.toFixed(2),
      totalLeaveDays,
      basePay: basePay.toFixed(2),
      totalDeduction: (perMonthSalary - basePay).toFixed(2),
    });
  }
    return Helper.response(true, "Attendance summary", data, res, 200);
  } catch (error) {
    console.error("Attendance calculation error:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};

function adjustLeaveRecords(leaveBalanceArr, leaveRecordsArr) {
  const toRemove = [];

  leaveBalanceArr.forEach((balance) => {
    const allowed = balance.remainingLeaves ?? 0;

    // Find matching leave records for same employee + leaveType
    const matchingRecords = leaveRecordsArr.filter(
      (rec) =>
        rec.employeeId == balance.employeeId &&
        rec.leaveTypeId == balance.leaveTypeId
    );

    if (matchingRecords.length > allowed) {
      // Sort by fromDate (oldest first)
      const sorted = [...matchingRecords].sort(
        (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
      );

      // Mark extra ones for removal
      toRemove.push(...sorted.slice(allowed));
    }
  });

  return toRemove;
}

//commented by me
// exports.calculateAttendance = async (req, res) => {
//     const { employeeId, month, year } = req.body;
//     const tenantId = req.users && req.users.tenantId;

//     if (!tenantId || !employeeId) {
//         return Helper.response(false, "TenantId and employeeId required", [], res, 400);
//     }

//     try {
//         // Attendance setting
//         const deduction = await attendanceSetting.findOne({ where: { tenantId } });
//         const GRACE_MINUTES = deduction.graceMinutes;
//         const HALF_DAY_THRESHOLD = deduction.halfdayToAbsentMin; // hours
//         const HALF_DAY_CUTOFF_MINUTES = deduction.halfDayThreshold; // minutes
//         const lateAllowanceMin = deduction.lateAllowanceMin;
//         const CtcValue= await Basic.findOne({
//           where:{
//             tenantId,
//             employeeId:employeeId,
//             dependent:'CTC',
//             status:'active'
//           }
//         })
//        const totalCTC =CtcValue?.amount
//         // Dates
//         const startDate = moment(`${year}-${String(month).padStart(2, '0')}-01`, "YYYY-MM-DD").startOf('month');
//         const endDate = moment(startDate).endOf('month');
//         const totalDaysInMonth = endDate.date();
//         const perMonthSalary = totalCTC / 12;
//         const perDaySalary = perMonthSalary / totalDaysInMonth;

//         // Approved Leaves Map
//         const leaveRecords = await leave_application.findAll({
//             where: {
//                 employeeId: employeeId,
//                 status: 'approved',
//                 [Op.or]: [
//                     {
//                         fromDate: {
//                             [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
//                         }
//                     },
//                     {
//                         toDate: {
//                             [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
//                         }
//                     },
//                     {
//                         fromDate: { [Op.lte]: startDate.format('YYYY-MM-DD') },
//                         toDate: { [Op.gte]: endDate.format('YYYY-MM-DD') }
//                     }
//                 ]
//             },
//             raw: true
//         });

//         const leaveDateMap = {};
//         for (const leave of leaveRecords) {
//             const leaveStart = moment(leave.fromDate);
//             const leaveEnd = moment(leave.toDate);
//             for (let d = moment(leaveStart); d <= leaveEnd; d.add(1, 'days')) {
//                 const dateKey = d.format('YYYY-MM-DD');
//                 leaveDateMap[dateKey] = leave.duration_type || 'full'; // full, first_half, second_half
//             }
//         }

//         // Collect working days with shifts
//         const workingDays = [];
//         let dynamicWorkingDays = 0;

//         for (let d = moment(startDate); d <= endDate; d.add(1, 'days')) {
//             const dayName = d.format('dddd');
//             const shift = await Shift.findOne({
//                 where: {
//                     day_of_week: dayName,
//                     status: 'active',
//                     tenantId
//                 },
//                 raw: true
//             });

//             workingDays.push({ date: d.clone(), shift });
//             dynamicWorkingDays++;
//         }

//         let fullDays = 0;
//         let halfDays = 0;
//         let lateDays = 0;
//         let graceLateCount = 0;
//         let absentDays = 0;

//         for (let entry of workingDays) {
//             const date = entry.date;
//             const shift = entry.shift;
//             const dayStr = date.format("YYYY-MM-DD");

//             const startOfDayUTC = `${dayStr} 00:00:00`;
//             const endOfDayUTC = `${dayStr} 23:59:59`;

//             if (!shift || shift.is_week_off) {
//                 fullDays++;
//                 continue;
//             }

//             const attendances = await attendance.findOne({
//                 where: {
//                     employeeId,
//                     check_in_time: {
//                         [Op.between]: [startOfDayUTC, endOfDayUTC],
//                     }
//                 },
//                 raw: true
//             });

//             if (!attendances || !attendances.check_in_time || !attendances.check_out_time) {
//                 const leaveType = leaveDateMap[dayStr];

//                 if (leaveType === 'full') {
//                     fullDays++;
//                 } else if (leaveType === 'first_half' || leaveType === 'second_half') {
//                     halfDays++;
//                 } else {
//                     absentDays++;
//                 }
//                 continue;
//             }

//             const shiftStart = moment(`${dayStr} ${shift.startTime}`, "YYYY-MM-DD HH:mm:ss");
//             const checkIn = moment(attendances.check_in_time);
//             const checkOut = moment(attendances.check_out_time);
//             const workedHours = moment.duration(checkOut.diff(checkIn)).asHours();
//             const graceTime = shiftStart.clone().add(GRACE_MINUTES, 'minutes');
//             const halfDayTime = shiftStart.clone().add(HALF_DAY_CUTOFF_MINUTES, 'minutes');

//             if (workedHours < HALF_DAY_THRESHOLD) {
//                 absentDays++;
//                 continue;
//             }

//             if (checkIn.isAfter(halfDayTime)) {
//                 halfDays++;
//             } else if (checkIn.isAfter(graceTime)) {
//                 lateDays++;
//                 if (graceLateCount < lateAllowanceMin) {
//                     graceLateCount++;
//                     fullDays++;
//                 } else {
//                     halfDays++;
//                 }
//             } else {
//                 if (workedHours < parseFloat(shift.workingHours)) {
//                     halfDays++;
//                 } else {
//                     fullDays++;
//                 }
//             }
//         }

//         const basePay = (fullDays * perDaySalary) + (halfDays * perDaySalary * 0.5);

//         const totalLeaveDays = Object.values(leaveDateMap).reduce((acc, type) => {
//             return acc + (type === 'full' ? 1 : 0.5);
//         }, 0);

//         return Helper.response(true, "Attendance summary", {
//             employeeId,
//             month,
//             year,
//             fullDays,
//             halfDays,
//             lateDays,
//             graceLateUsed: graceLateCount,
//             absentDays,
//             totalWorkingDays: dynamicWorkingDays,
//             totalDaysInMonth,
//             perDaySalary: perDaySalary.toFixed(2),
//             totalLeaveDays,
//             basePay: basePay.toFixed(2),
//             totalDeduction: (perMonthSalary - basePay).toFixed(2)
//         }, res, 200);

//     } catch (error) {
//         console.error("Attendance calculation error:", error);
//         return Helper.response(false, error?.message, [], res, 500);
//     }
// };
