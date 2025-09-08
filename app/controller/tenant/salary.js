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
const allowance = require("../../models/allowance");
const deduction = require("../../models/deductions");
const bill_info = require("../../models/bill_info");
const bill = require("../../models/bill");
const Designation = require("../../models/designation");

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
  let { employeeId, month, year } = req.body;
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
    const empData = await empPersonal.findAll({
      where: {
        id: {
          [Op.in]: employeeId,
        },
      },
      attributes: ["id", "shift_id"],
      raw: true,
    });
    if (!empData || empData.length == 0) {
      return Helper.response(false, "Employee not found", [], res, 400);
    }
    // Check if shift is assigned

    // const checkshift = await Shift.findAll({
    //   where: {
    //     tenantId,
    //     shift:empData.shift_id
    //   },
    // });
    const checkshift = await Shift.findAll({
      where: {
        tenantId,
        shift: {
          [Op.ne]: empData.map((i) => i.shift_id).filter((s) => s != null)[0],
        },
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

    const employees = await bill.findAll({
      where: {
        employeeId: { [Op.in]: employeeId },
        tenantId,
        month,
        year,
      },
      raw: true,
      attributes: ["employeeId"],
    });

    employeeId = employeeId.filter((item) => {
      return !employees.some((emp) => emp.employeeId == item);
    });

    for (let i = 0; i < employeeId.length; i++) {
      const CtcValue = await Basic.findOne({
        where: {
          tenantId,
          employeeId: employeeId[i],
          status: "active",
        },
      });
      if (!CtcValue) {
        return Helper.response(
          false,
          "Add Salary Component First",
          [],
          res,
          400
        );
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

      leaveRecords = Helper.adjustLeaveRecords(
        leavebalance,
        applysandwitchleave
      );
      const leaveDateMap = {};
      for (const leave of leaveRecords) {
        const leaveStart = moment(leave.fromDate);
        const leaveEnd = moment(leave.toDate);
        for (let d = moment(leaveStart); d <= leaveEnd; d.add(1, "days")) {
          const dateKey = d.format("YYYY-MM-DD");
          // leaveDateMap[dateKey] = leave.duration_type || "full"; // full, first_half, second_half
          leaveDateMap[dateKey] = {
            duration_type: leave.duration_type || "full", // full, first_half, second_half
            leavestatus: leave.leavestatus,
          };
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
            shift: PersonalInfo?.shift_id,
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
          if(!leaveDateMap[dayStr]){
          if (!shift || shift.is_week_off) {
          fullDays++;
          continue;
        }
          // }
          }
       
        const getMonthlyAttendance = await attendance.findAll({
          where: {
            employeeId: employeeId[i],
            tenantId,
            month,
            year,
          },
          raw: true,
        });
        if (getMonthlyAttendance && getMonthlyAttendance.length > 0) {
          if (!shift || shift.is_week_off) {
            fullDays++;
            continue;
          }
        }

        const attendances = await attendance.findOne({
          where: {
            employeeId: employeeId[i],
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

          if (leaveType?.duration_type == "full" && leaveType?.leavestatus == "unpaid") {
            // fullDays++;
            absentDays++;
          } else if (
            leaveType?.duration_type === "first_half" ||
            leaveType?.duration_type === "second_half"
          ) {
            halfDays++;
          } else if (
            getMonthlyAttendance &&
            getMonthlyAttendance.length > 0 &&
            holidaydata
          ) {
            fullDays++;
          } else if (leaveType?.duration_type === "half_full") {
            halfDays++;
          } else if (leaveType?.leavestatus == "approved") {
            fullDays++;
          } 
          // else if(leaveType?.leavestatus == "unpaid"){
          //   absentDays++;
          // }
          
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

      const totalLeaveDays = Object.values(leaveDateMap1).reduce(
        (acc, type) => {
          return acc + (type == "full" ? 1 : 0.5);
        },
        0
      );

      const basePay = fullDays * perDaySalary + halfDays * perDaySalary * 0.5;
      const allowedLeave = leavebalance.reduce((acc, remainingLeaves) => {
        return acc + Number(remainingLeaves.remainingLeaves);
      }, 0);
      const TotalSalary = totalDaysInMonth * perDaySalary;
      data.push({
        employeeId: employeeId[i],
        employeeName: `${PersonalInfo?.firstName} ${PersonalInfo?.lastName}`,
        empCode: PersonalInfo?.empCode,
        month,
        year,
        fullDays,
        halfDays,
        lateDays,
        graceLateUsed: graceLateCount,
        absentDays,
        allowedLeave,
        totalWorkingDays: dynamicWorkingDays,
        TotalSalary: TotalSalary.toFixed(2),
        totalDaysInMonth,
        perDaySalary: perDaySalary.toFixed(2),
        totalLeaveDays,
        basePay: basePay.toFixed(2),
        totalDeduction: (perMonthSalary - basePay).toFixed(2),
      });
    }
    if(data.length == 0){
      return Helper.response(false, "Salary already generated for all selected employees", [], res, 400);
    }
    return Helper.response(true, "Data Found Successfully", data, res, 200);
  } catch (error) {
    console.error("Attendance calculation error:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};
exports.calculateSalaryComponent = async (req, res) => {
  try {
    const { employeeId, fullDays, totalDaysInMonth } = req.body;
    const tenantId = req.users?.tenantId;

    if (!tenantId || !employeeId) {
      return Helper.response(
        false,
        "TenantId and employeeId required",
        [],
        res,
        400
      );
    }

    // reusable function to fetch and transform
    const fetchAndTransform = async (Model, payCode) => {
      const data = await Model.findAll({
        where: { tenantId, employeeId, status: "active" },
        raw: true,
        order: [["createdAt", "desc"]],
      });

      return data.map((item) => {
        const payAmount = Math.round(
          (item.finalAmount / 12 / totalDaysInMonth) * fullDays
        );
        return {
          ...item,
          pay_code: payCode,
          pay_amount: payAmount,
          deduct_amount: Math.abs(item.finalAmount - payAmount),
        };
      });
    };

    // parallelize DB calls for efficiency
    const [allowanceData, basicData] = await Promise.all([
      fetchAndTransform(allowance, "PAY"),
      fetchAndTransform(Basic, "PAY"),
      // fetchAndTransform(deduction, "DED"),
    ]);

    const data = [...allowanceData, ...basicData];

    return Helper.response(true, "Salary breakup", data, res, 200);
  } catch (error) {
    console.error("Attendance calculation error:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};

// exports.generateSalary = async (req, res) => {
//   const t = await bill_info.sequelize.transaction();
//   const tenantId = req.users?.tenantId;
//   const createdBy = req.users?.id;

//   try {
//     const employees = req.body;
//     // console.log(employees, 'employees');
    
//     // return false
//     if (!tenantId || !employees || employees.length === 0) {
//       return Helper.response(
//         false,
//         "Required fields are missing",
//         {},
//         res,
//         400
//       );
//     }

//     const skippedEmployees = [];
//     const billRecords = []; // For bill (summary)
//     const billInfoRecords = []; // For bill_info (components)

//     for (const emp of employees) {
//       if (!emp.employeeId || !emp.components) continue;

//       // Check if salary already exists for this employee/month
//       const existing = await bill.findOne({
//         where: {
//           tenantId,
//           employeeId: emp.employeeId,
//           year: Number(emp.year),
//           month: Number(emp.month),
//         },
//         transaction: t,
//       });

//       if (existing) {
//         skippedEmployees.push({
//           employeeId: emp.employeeId,
//           year: emp.year,
//           month: emp.month,
//           reason: "Salary already generated",
//         });
//         continue;
//       }

//       // --- Insert into bill (summary)
//       const billData = {
//         tenantId,
//         employeeId: emp.employeeId,
//         year: Number(emp.year),
//         month: Number(emp.month),
//         bill_date: new Date(),
//         net_amount: parseInt(emp.TotalSalary), // from payload
//         full_days: emp?.fullDays || 0,
//         absent_days: emp?.absentDays || 0,
//         hours_worked: emp?.hoursWorked || null,
//         bill_desc: "Auto-generated salary",
//         status: "active",
//         createdBy,
//       };

//       const billRow = await bill.create(billData, { transaction: t });

//       // --- Insert into bill_info (component breakdown)
//       emp.components.forEach((comp) => {
//         billInfoRecords.push({
//           tenantId,
//           employeeId: emp.employeeId,
//           year: Number(emp.year),
//           month: Number(emp.month),
//           bill_date: new Date(),
//           bill_id: billRow.bill_id, // link bill_info → bill
//           pay_component_id: comp.id,
//           pay_code: comp.pay_code,
//           amount: comp.pay_amount,
//           status: "active",
//           createdBy,
//         });
//       });

//       billRecords.push(billRow);
//     }

//     // Save all bill_info rows
//     if (billInfoRecords.length > 0) {
//       await bill_info.bulkCreate(billInfoRecords, { transaction: t });
//     }

//     await leave_balance.update(
//       { usedLeaves: totalLeaveDays, remainingLeaves: allowedLeave - totalLeaveDays },
//       {
//         where: {
//           employeeId: { [Op.in]: employees.map((e) => e.employeeId) },
//           year: { [Op.in]: employees.map((e) => e.year) },
//           tenantId,
//         },
//         transaction: t,
//       }
//     );

//     await t.commit();
//     if (billRecords.length == 0) {
//       return Helper.response(
//         false,
//         "Salary already generated for all selected employees",
//         {
//           generatedCount: billRecords.length,
//           skippedCount: skippedEmployees.length,
//           skippedEmployees,
//           generatedSalaries: billRecords,
//         },
//         res,
//         200
//       );
//     }
//     return Helper.response(
//       true,
//       "Salary generation completed",
//       {
//         generatedCount: billRecords.length,
//         skippedCount: skippedEmployees.length,
//         skippedEmployees,
//         generatedSalaries: billRecords,
//       },
//       res,
//       200
//     );
//   } catch (error) {
//     await t.rollback();
//     console.error("Error saving salaries:", error);
//     return Helper.response(false, error?.message, [], res, 500);
//   }
// };


exports.generateSalary = async (req, res) => {
  const t = await bill_info.sequelize.transaction();
  const tenantId = req.users?.tenantId;
  const createdBy = req.users?.id;

  try {
    const employees = req.body;
    if (!tenantId || !employees || employees.length === 0) {
      return Helper.response(false, "Required fields are missing", {}, res, 400);
    }

    const skippedEmployees = [];
    const billRecords = [];
    const billInfoRecords = [];

    for (const emp of employees) {
      if (!emp.employeeId || !emp.components) continue;

      // Check if salary already exists
      const existing = await bill.findOne({
        where: { tenantId, employeeId: emp.employeeId, year: emp.year, month: emp.month },
        transaction: t,
      });

      if (existing) {
        skippedEmployees.push({
          employeeId: emp.employeeId,
          year: emp.year,
          month: emp.month,
          reason: "Salary already generated",
        });
        continue;
      }

    
      await leave_balance.update(
        {
          usedLeaves:emp?.totalLeaveDays ,
          remainingLeaves: (emp?.allowedLeave - emp?.totalLeaveDays<0)?0:(emp?.allowedLeave - emp?.totalLeaveDays),
        },
        {
          where: { employeeId : emp?.employeeId,tenantId, year: emp?.year },
          transaction: t,
        }
      );

      // --- Insert into bill (summary)
      const billData = {
        tenantId,
        employeeId: emp.employeeId,
        year: Number(emp.year),
        month: Number(emp.month),
        bill_date: new Date(),
        net_amount: parseInt(emp.basePay), // from payload
        full_days: emp?.fullDays || 0,
        absent_days: emp?.absentDays || 0,
        hours_worked: emp?.hoursWorked || null,
        bill_desc: "Auto-generated salary",
        status: "active",
        createdBy,
      };

      const billRow = await bill.create(billData, { transaction: t });

      // --- Insert into bill_info (component breakdown)
      emp.components.forEach((comp) => {
        billInfoRecords.push({
          tenantId,
          employeeId: emp.employeeId,
          year: Number(emp.year),
          month: Number(emp.month),
          bill_date: new Date(),
          bill_id: billRow.bill_id, // link bill_info → bill
          pay_component_id: comp.id,
          pay_code: comp.pay_code,
          amount: comp.pay_amount,
          status: "active",
          createdBy,
        });
      });

      billRecords.push(billRow);
    }

    // Save all bill_info rows
    if (billInfoRecords.length > 0) {
      await bill_info.bulkCreate(billInfoRecords, { transaction: t });
    }

    await t.commit();

    // return Helper.response(true, "Salary generation completed", {
    //   generatedCount: billRecords.length,
    //   skippedCount: skippedEmployees.length,
    //   skippedEmployees,
    //   generatedSalaries: billRecords,
    // }, res, 200);

    if (billRecords.length == 0) {
      return Helper.response(
        false,
        "Salary already generated for all selected employees",
        {
          generatedCount: billRecords.length,
          skippedCount: skippedEmployees.length,
          skippedEmployees,
          generatedSalaries: billRecords,
        },
        res,
        200
      );
    }
    return Helper.response(
      true,
      "Salary generation completed",
      {
        generatedCount: billRecords.length,
        skippedCount: skippedEmployees.length,
        skippedEmployees,
        generatedSalaries: billRecords,
      },
      res,
      200
    );

  } catch (error) {
    await t.rollback();
    console.error("Error saving salaries:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};


exports.GeneratedSalaryList = async (req, res) => {
  const tenantId = req.users?.tenantId;
  const createdBy = req.users?.id;

  try {
    const { employeeId, month, year } = req.body;

    if (!tenantId || !employeeId || employeeId.length === 0) {
      return Helper.response(
        false,
        "Required fields are missing",
        {},
        res,
        400
      );
    }

    const GetSalaryList = await bill.findAll({
      where: {
        employeeId: { [Op.in]: employeeId },
        month,
        year,
        tenantId,
        status: "active",
      },
      order: [["createdAt", "desc"]],
      raw: true,
    });

    if (GetSalaryList.length == 0) {
      return Helper.response(false, "No Data Found", {}, res, 200);
    }

    const data = await Promise.all(
      GetSalaryList.map(async (item) => {
        const personaldetail = await empPersonal.findOne({
          where: {
            id: item?.employeeId,
            status: "active",
          },
        });
        // const Empdesignation=await Designation.findOne({
        //   where:{
        //     tenantId,
        //     employeeId,
        //     status:'active'
        //   }
        // })
        return {
          ...item,
          employeeName: `${personaldetail?.firstName} ${personaldetail?.lastName}`,
          empCode: personaldetail?.empCode,
          email: personaldetail?.email,
          phone: personaldetail?.mobile,
          // 'designation':Empdesignation?.name
        };
      })
    );
    return Helper.response(true, "Salary generation completed", data, res, 200);
  } catch (error) {
    console.error("Error saving salaries:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};

exports.revertSalary = async (req, res) => {
  const tenantId = req.users?.tenantId;
  const createdBy = req.users?.id;

  const t = await bill.sequelize.transaction();

  try {
    const { employeeId, month, year, id, bill_id } = req.body;

    if (!tenantId || !employeeId || !month || !year || !id || !bill_id) {
      return Helper.response(
        false,
        "Required fields are missing",
        {},
        res,
        400
      );
    }

    const deleteBill = await bill.destroy({
      where: { id },
      transaction: t,
    });

    const deleteBillInfo = await bill_info.destroy({
      where: {
        bill_id,
        month,
        year,
        employeeId,
      },
      transaction: t,
    });

    // if (deleteBill === 0 && deleteBillInfo === 0) {
    //   await t.rollback();
    //   return Helper.response(false, "No Data Found", {}, res, 200);
    // }

    await t.commit();

    return Helper.response(true, "Salary reverted successfully", {}, res, 200);
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Error reverting salary:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};

// exports.generateSalary = async (req, res) => {
//   const t = await bill_info.sequelize.transaction();
//   const tenantId = req.users?.tenantId;
//   const createdBy = req.users?.id;

//   try {
//     const employees = req.body;

//     if (!tenantId || !employees || employees.length === 0) {
//       return Helper.response(
//         false,
//         "Required fields are missing",
//         {},
//         res,
//         400
//       );
//     }

//     const records = [];
//     const skippedEmployees = [];

//     for (const emp of employees) {
//       if (!emp.employeeId || !emp.components) continue;

//       const existing = await bill_info.findOne({
//         where: {
//           tenantId,
//           employeeId: emp.employeeId,
//           year: Number(emp.year),
//           month: Number(emp.month),
//         },
//         transaction: t,
//       });

//       if (existing) {
//         skippedEmployees.push({
//           employeeId: emp.employeeId,
//           year: emp.year,
//           month: emp.month,
//           reason: "Salary already generated",
//         });
//         continue;
//       }

//       emp.components.forEach((comp) => {
//         records.push({
//           tenantId,
//           employeeId: emp.employeeId,
//           year: Number(emp.year),
//           month: Number(emp.month),
//           bill_date: new Date(),

//           pay_component_id: comp.id,
//           pay_code: comp.pay_code,
//           amount: comp.pay_amount,
//           net_amount: parseInt(comp.finalAmount),

//           full_days: emp?.fullDays || 0,
//           absent_days: emp?.absentDays || 0,
//           hours_worked: emp?.hoursWorked || null,

//           bill_desc: "Auto-generated salary",
//           status: "active",
//           createdBy,
//         });
//       });
//     }

//     if (records.length === 0) {
//       await t.rollback();

//       return Helper.response(
//         false,
//         "All selected employees already have salary generated",
//         skippedEmployees,
//         res,
//         400
//       );
//     }

//         const billcreate = await bill.bulkCreate(records, { transaction: t });
//     const bills = await bill_info.bulkCreate(records, { transaction: t });
//     await t.commit();

//     const data = {
//       generatedCount: bills.length,
//       skippedCount: skippedEmployees.length,
//       skippedEmployees,
//       generatedSalaries: bills,
//     };
//     return Helper.response(true, "Salary generation completed", data, res, 200);
//   } catch (error) {
//     await t.rollback();
//     console.error("Error saving salaries:", error);
//     return Helper.response(false, error?.message, [], res, 500);
//   }
// };
