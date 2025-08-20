const { Op, Sequelize, fn, col, literal } = require("sequelize");
const Helper = require("../../helper/helper");
const attendance = require("../../models/attendance");
const attendanceSetting = require("../../models/attendanceSetting");
const deduction = require("../../models/deductions");
const moment = require("moment");
const Shift = require("../../models/shift");
const empPersonal = require("../../models/empPersonal");
const Holiday = require("../../models/holiday");
const holiday = require("../../models/holiday");
const path = require("path");
const fs = require("fs");
exports.attendanceMaster = async (req, res) => {
  const {
    lateAllowanceMin,
    graceMinutes,
    lateToHalfdayMin,
    halfdayToAbsentMin,
  } = req.body;
  const tenantId = req.users && req.users.tenantId;

  try {
    const existingSetting = await attendanceSetting.findOne({
      where: { tenantId },
    });
    if (existingSetting) {
      return Helper.response(
        false,
        "Attendance settings already exist for this tenant.",
        [],
        res,
        400
      );
    }
    const attendanceSettings = new attendanceSetting();
    attendanceSettings.tenantId = tenantId;
    attendanceSettings.lateAllowanceMin = lateAllowanceMin;
    attendanceSettings.graceMinutes = graceMinutes;
    attendanceSettings.halfDayThreshold = lateToHalfdayMin;
    attendanceSettings.halfdayToAbsentMin = halfdayToAbsentMin;
    if (attendanceSettings.save()) {
      return Helper.response(
        true,
        "Attendance settings created successfully.",
        attendanceSettings,
        res,
        200
      );
    }
    return Helper.response(
      false,
      "Failed to create attendance settings.",
      [],
      res,
      400
    );
  } catch (error) {
    console.error("Error creating attendance settings:", error);
    return Helper.response(false, "Internal server error.", [], res, 500);
  }
};

exports.getAttendanceSettings = async (req, res) => {
  const tenantId = req.users && req.users.tenantId;
  //console.log("tenantId", req.users);
  try {
    const settings = await attendanceSetting.findOne({ where: { tenantId } });
    if (!settings) {
      return Helper.response(
        false,
        "Attendance settings not found for this tenant.",
        [],
        res,
        404
      );
    }
    return Helper.response(
      true,
      "Attendance settings retrieved successfully.",
      [settings],
      res,
      200
    );
  } catch (error) {
    console.error("Error retrieving attendance settings:", error);
    return Helper.response(false, "Internal server error.", [], res, 500);
  }
};

exports.updateAttendanceSettings = async (req, res) => {
  const {
    lateAllowanceMin,
    graceMinutes,
    lateToHalfdayMin,
    halfdayToAbsentMin,
  } = req.body;
  const tenantId = req.users && req.users.tenantId;

  try {
    const settings = await attendanceSetting.findOne({ where: { tenantId } });
    if (!settings) {
      return Helper.response(
        false,
        "Attendance settings not found for this tenant.",
        [],
        res,
        400
      );
    }

    settings.lateAllowanceMin = lateAllowanceMin;
    settings.graceMinutes = graceMinutes;
    settings.halfDayThreshold = lateToHalfdayMin;
    settings.halfdayToAbsentMin = halfdayToAbsentMin;

    if (await settings.save()) {
      return Helper.response(
        true,
        "Attendance settings updated successfully.",
        settings,
        res,
        200
      );
    }
    return Helper.response(
      false,
      "Failed to update attendance settings.",
      [],
      res,
      400
    );
  } catch (error) {
    console.error("Error updating attendance settings:", error);
    return Helper.response(false, "Internal server error.", [], res, 500);
  }
};

exports.getMonthlyAttendance = async (req, res) => {
  const { emp_id, month, year } = req.body;
  const tenantId = req.users && req.users.tenantId;

  if (!emp_id || !month || !year) {
    return Helper.response(
      false,
      "emp_id, month, and year are required.",
      [],
      res,
      200
    );
  }

  // try {
  //     const startDate = moment(`${year}-${month}-01`)
  //     const endDate = startDate.clone().endOf('month')
  //     const totalDays = endDate.date()
  //     let records

  //     const shiftMap = await Shift.findAll({
  //         where: {
  //             status: 'active',
  //             tenantId
  //         },
  //         attributes: ['day_of_week', 'is_week_off'],
  //         raw: true
  //     });

  //     const weekOffDays = shiftMap
  //         .filter(shift => shift.is_week_off === true)
  //         .map(shift => shift.day_of_week);

  //     if (emp_id == 'All') {
  //         records = await attendance.findAll({
  //             where: {
  //                 check_in_time: {
  //                     [Op.between]: [
  //                         startDate.format('YYYY-MM-DD 00:00:00'),
  //                         endDate.format('YYYY-MM-DD 23:59:59')
  //                     ]
  //                 }
  //             },
  //             raw: true
  //         });
  //     } else {
  //         records = await attendance.findAll({
  //             where: {
  //                 employeeId: emp_id,
  //                 check_in_time: {
  //                     [Op.between]: [
  //                         startDate.format('YYYY-MM-DD 00:00:00'),
  //                         endDate.format('YYYY-MM-DD 23:59:59')
  //                     ]
  //                 }
  //             },
  //             raw: true
  //         });
  //     }
  //     const result = [];
  //     const recordMap = {}
  //     records.forEach(r => {
  //         const day = moment(r.check_in_time).date();
  //         recordMap[day] = {
  //             checkIn: r.check_in_time ? r.check_in_time : null,
  //             checkOut: r.check_out_time ? r.check_out_time : null,
  //             status: (r.check_in_time && r.check_out_time) ? 'Present' : 'Absent'
  //         };
  //     });
  //     for (let i = 1; i <= totalDays; i++) {
  //         const currentDate = moment(`${year}-${month}-${i}`, 'YYYY-MM-DD');
  //         const dayName = currentDate.format('dddd');

  //         if (weekOffDays.includes(dayName)) {
  //             result.push({
  //                 date: currentDate.format('YYYY-MM-DD'),
  //                 checkIn: null,
  //                 checkOut: null,
  //                 status: 'Week Off'
  //             });
  //         } else {
  //             const data = recordMap[i];
  //             result.push({
  //                 date: currentDate.format('YYYY-MM-DD'),
  //                 checkIn: data?.checkIn || null,
  //                 checkOut: data?.checkOut || null,
  //                 status: data?.status || 'Absent'
  //             });
  //         }
  //     }

  //     console.log(result)
  //     return false
  //     return Helper.response(true, "Record Found Successfully!", result, res, 200);
  // } catch (error) {
  //     console.error("Error updating attendance settings:", error);
  //     return Helper.response(false, "Internal server error.", [], res, 500);
  // }

  try {
    const startDate = moment(
      `${year}-${String(month).padStart(2, "0")}-01`,
      "YYYY-MM-DD"
    );
    const endDate = startDate.clone().endOf("month");
    const totalDays = endDate.date();

    const shiftMap = await Shift.findAll({
      where: {
        status: "active",
        tenantId,
      },
      attributes: ["day_of_week", "is_week_off"],
      raw: true,
    });

    const weekOffDays = shiftMap
      .filter((shift) => shift.is_week_off === true)
      .map((shift) => shift.day_of_week);

    let records = [];
    let employees = [];

    if (emp_id === "All" || emp_id === "all") {
      employees = await empPersonal.findAll({
        where: { tenantId },
        attributes: ["id", "firstName", "lastName"],
        raw: true,
      });

      records = await attendance.findAll({
        where: {
          check_in_time: {
            [Op.between]: [
              startDate.format("YYYY-MM-DD 00:00:00"),
              endDate.format("YYYY-MM-DD 23:59:59"),
            ],
          },
        },
        raw: true,
      });
    } else {
      const emp = await empPersonal.findOne({
        where: { id: emp_id },
        attributes: ["id", "firstName", "lastName"],
        raw: true,
      });
      // console.log(emp, "ddd");
      if (!emp)
        return Helper.response(false, "Employee not found", [], res, 404);

      employees = [emp];

      records = await attendance.findAll({
        where: {
          employeeId: emp_id,
          check_in_time: {
            [Op.between]: [
              startDate.format("YYYY-MM-DD 00:00:00"),
              endDate.format("YYYY-MM-DD 23:59:59"),
            ],
          },
        },
        raw: true,
      });
    }
    const groupedRecords = {};
    records.forEach((r) => {
      const day = moment(r.check_in_time).date();
      if (!groupedRecords[r.employeeId]) groupedRecords[r.employeeId] = {};
      groupedRecords[r.employeeId][day] = {
        checkIn: r.check_in_time || null,
        checkOut: r.check_out_time || null,
        status: r.check_in_time && r.check_out_time ? "Present" : "Absent",
      };
    });

    const finalResult = [];

    for (const emp of employees) {
      const recordMap = groupedRecords[emp.id] || {};
      const data = [];

      console.log(emp, "fffffffff");

      for (let i = 1; i <= totalDays; i++) {
        const currentDate = moment(`${year}-${month}-${i}`, "YYYY-MM-DD");
        const dayName = currentDate.format("dddd");

        if (weekOffDays.includes(dayName)) {
          data.push({
            date: currentDate.format("YYYY-MM-DD"),
            checkIn: null,
            checkOut: null,
            status: "Week Off",
          });
        } else {
          const entry = recordMap[i];
          data.push({
            date: currentDate.format("YYYY-MM-DD"),
            checkIn: entry?.checkIn || null,
            checkOut: entry?.checkOut || null,
            status: entry?.status || "Absent",
          });
        }
      }

      finalResult.push({
        employee_name: Helper.capitalizeFirstLetter(
          `${emp.firstName} ${emp.lastName}`
        ),
        data,
      });
    }

    return Helper.response(
      true,
      "Record Found Successfully!",
      finalResult,
      res,
      200
    );
  } catch (error) {
    console.error("Error updating attendance settings:", error);
    return Helper.response(false, "Internal server error.", [], res, 500);
  }
};

exports.getDateWiseAttendance = async (req, res) => {
  const { emp_id, startDate, endDate } = req.body;
  const tenantId = req.users && req.users.tenantId;
  if (!emp_id || !startDate) {
    return Helper.response(false,"emp_id and date are required.",[],res,200);
  }

  try {
    let data = [];
    const shiftMap = await Shift.findAll({
      where: {
        status: "active",
        tenantId,
      },
      attributes: ["day_of_week", "is_week_off"],
      raw: true,
    });

    const weekOffDays = shiftMap
      .filter((shift) => shift.is_week_off == true)
      .map((shift) => shift.day_of_week);

    const start = moment(startDate); // convert string to moment
    const end = moment(endDate);
    // const totalDays = end.date() - start.date() + 1;
    const totalDays = end.diff(start, "days") + 1;

    let employees = [];
    let records = [];
    if (emp_id === "All" || emp_id === "all") {
      employees = await empPersonal.findAll({
        where: { tenantId },
        attributes: ["id", "firstName", "lastName"],
        raw: true,
      });
      records = await attendance.findAll({
        where: {
          check_in_time: {
            [Op.between]: [
              start.format("YYYY-MM-DD HH:mm:ss"),
              end.format("YYYY-MM-DD HH:mm:ss"),
            ],
          },
          tenantId: tenantId,
        },
        raw: true,
      });
    } else {
      const emp = await empPersonal.findOne({
        where: { id: emp_id },
        attributes: ["id", "firstName", "lastName"],
        raw: true,
      });
      // console.log(emp, "ddd");
      if (!emp)
        return Helper.response(false, "Employee not found", [], res, 404);

      employees = [emp];
      records = await attendance.findAll({
        where: {
          employeeId: emp_id,
          check_in_time: {
            [Op.between]: [
              start.format("YYYY-MM-DD HH:mm:ss"),
              end.format("YYYY-MM-DD HH:mm:ss"),
            ],
          },
        },
        raw: true,
      });
    }

    if (records.length === 0) {
      return Helper.response(
        false,
        "No attendance records found for the given date.",
        [],
        res,
        404
      );
    }

    const groupedRecords = {};
    records.forEach((r) => {
      const day = moment(r.check_in_time).date();
      if (!groupedRecords[r.employeeId]) groupedRecords[r.employeeId] = {};
      groupedRecords[r.employeeId][day] = {
        id: r.id,
        checkIn: r.check_in_time || null,
        checkOut: r.check_out_time || null,
        status: r.check_in_time && r.check_out_time ? "Present" : "Absent",
      };
    });


    for (const emp of employees) {
      const recordMap = groupedRecords[emp.id] || {};

      const startDate1 = moment(startDate, "YYYY-MM-DD");
      const endDate1 = moment(endDate, "YYYY-MM-DD");
      let currentDate = startDate1.clone();
      while (currentDate.isSameOrBefore(endDate1)) {
        const dayName = currentDate.format("dddd");

        if (weekOffDays.includes(dayName)) {
          data.push({
            date: currentDate.format("YYYY-MM-DD"),
            checkIn: '--',
            checkOut: '--',
            status: "Week Off",
            employee_name: Helper.capitalizeFirstLetter(`${emp.firstName} ${emp.lastName}`),
            employeeId:emp?.id
          });
        } else {
          // Here you can map data by date instead of day index
          // const entry = recordMap[currentDate.format("YYYY-MM-DD")];
          const dayKey = String(currentDate.date());
          const entry = recordMap[dayKey];
          data.push({
            date: currentDate.format("YYYY-MM-DD"),
            checkIn: entry?.checkIn.split(" ")[1] || '--',
            checkOut: entry?.checkOut.split(" ")[1] || '--',
            status: entry?.status || "Absent",
            id: entry?.id,
            employee_name: Helper.capitalizeFirstLetter(`${emp.firstName} ${emp.lastName}`),
            employeeId:emp?.id
          });
        }

        currentDate.add(1, "day");
      }
    }

    return Helper.response(true, "Record Found Successfully!", data, res, 200);
  } catch (error) {
    console.error("Error fetching date-wise attendance:", error);
    return Helper.response(false, error.message, [], res, 500);
  }
};

exports.getAttendanceYears = async (req, res) => {
  try {
    const years = await attendance.findAll({
      attributes: [
        [Sequelize.literal(`DISTINCT EXTRACT(YEAR FROM "createdAt")`), "year"],
      ],
      order: [[Sequelize.literal(`EXTRACT(YEAR FROM "createdAt")`), "DESC"]],
      raw: true,
    });

    const response = years.map((y) => ({
      value: y.year.toString(),
      label: y.year.toString(),
    }));
    return Helper.response(
      true,
      "Record Found Successfully!",
      response,
      res,
      200
    );
  } catch (err) {
    console.error("Error fetching years:", err);
    return Helper.response(false, "Internal server error.", [], res, 500);
  }
};

exports.updateAttendance = async (req, res) => {
  const { id, status='active', checkIn, checkOut, date, employeeId } = req.body;
  const tenantId = req.users?.tenantId;
  const ip_address = await Helper.getIpAddress(req)
  try {
    if (!tenantId || !employeeId) {
      return Helper.response(
        false,
        "Tenant ID and ID are required",
        null,
        res,
        400
      );
    }

    const employeeExists = await attendance.findOne({
      where: { employeeId: employeeId, tenantId,date },
    });
    if (!employeeExists) {
      await attendance.create({
        employeeId,
        tenantId,
        status,
       check_in_time: checkIn,
        check_out_time:checkOut,
        date,
        ip_address,
        createdBy:req.users?.id
      })

    return Helper.response(true,"Atttendance updated successfully",{},res,200);
      // return Helper.response(false, "Atendance not found", null, res, 404);
    }

    employeeExists.updatedBy = req.users?.id;
    employeeExists.updatedAt = new Date();
    employeeExists.check_in_time = checkIn;
    employeeExists.check_out_time = checkOut;
    employeeExists.date = date;
    employeeExists.status = status || "active";
    await employeeExists.save();

    return Helper.response(
      true,
      "Atttendance updated successfully",
      {},
      res,
      200
    );
  } catch (error) {
    console.error("Error updating Atttendance:", error);
    return Helper.response(false, error?.message, null, res, 500);
  }
};

exports.deleteAttendance = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !id) {
      return Helper.response(
        false,
        "Tenant ID And ID are required",
        null,
        res,
        400
      );
    }

    const delteAttendance = await attendance.findOne({
      where: { id: id, tenantId },
    });

    if (!delteAttendance) {
      return Helper.response(false, "Data not found", null, res, 404);
    }

    await delteAttendance.destroy();

    return Helper.response(
      true,
      "Attendance deleted successfully",
      null,
      res,
      200
    );
  } catch (error) {
    console.error("Error deleting Attendance:", error);
    return Helper.response(false, error?.message, null, res, 500);
  }
};

exports.addHoliday = async (req, res) => {
  const { holiday_type, holiday_name, date, status } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !holiday_type || !holiday_name || !date) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(
        false,
        "Invalid request. Please provide all required fields.",
        [],
        res,
        400
      );
    }

    const existingHoliday = await Holiday.findOne({
      where: { tenantId, holiday_type, holiday_name, date },
    });
    if (existingHoliday) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(
        false,
        "Holiday already exists for this tenant.",
        [],
        res,
        400
      );
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return Helper.response(false, "No files uploaded", null, res, 400);
    }

    const createdDocs = [];

    for (const file of req.files) {
      const newDoc = await Holiday.create({
        tenantId,
        holiday_type,
        holiday_name,
        date,
        doc_type: file.mimetype,
        image: file.filename,
        createdBy: req.users?.id,
        updatedBy: req.users?.id,
        status: status || "active",
      });
      createdDocs.push(newDoc);
    }

    return Helper.response(
      true,
      "Holiday added successfully",
      createdDocs,
      res,
      200
    );
  } catch (error) {
    console.error("Error adding document:", error);
    Helper.deleteUploadedFiles(req.files);
    return Helper.response(false, "Internal server error", null, res, 500);
  }
};

exports.getHolidayList = async (req, res) => {
  try {
    const data = await Holiday.findAll({
      where: {
        tenantId: req.users?.tenantId,
        status: "active",
      },
      attributes: [
        "id",
        "holiday_type",
        "holiday_name",
        "date",
        "doc_type",
        "image",
        "status",
        [fn("TO_CHAR", col("updatedAt"), "YYYY-MM-DD HH24:MI:SS"), "updatedAt"],
        [fn("TO_CHAR", col("createdAt"), "YYYY-MM-DD HH24:MI:SS"), "createdAt"],

        "createdBy",
      ],
      order: [["createdAt", "desc"]],
      raw: true,
    });

    return Helper.response(true, "Record Found Successfully!", data, res, 200);
  } catch (err) {
    console.error("Error fetching Holiday:", err);
    return Helper.response(false, err?.message, [], res, 500);
  }
};

exports.updateHoliday = async (req, res) => {
  const { id, status, holiday_type, holiday_name, date } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !id) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(
        false,
        "Tenant ID and ID are required",
        null,
        res,
        400
      );
    }

    const employeeExists = await holiday.findOne({
      where: { id: id, tenantId },
    });
    if (!employeeExists) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(false, "Holiday not found", null, res, 404);
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return Helper.response(false, "No files uploaded", null, res, 400);
    }

    const updatedDocuments = [];
    let existingDoc;
    for (const file of req.files) {
      existingDoc = await holiday.findOne({
        where: { tenantId, id },
      });

      if (existingDoc) {
        const oldFilePath = path.join(
          __dirname,
          "../../../upload",
          existingDoc.image
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        existingDoc.image = file.filename;
        existingDoc.doc_type = file.mimetype;
        existingDoc.updatedBy = req.users?.id;
        existingDoc.updatedAt = new Date();
        existingDoc.holiday_type = holiday_type;
        existingDoc.holiday_name = holiday_name;
        existingDoc.date = date;
        existingDoc.status = status || "active";
        await existingDoc.save();

        // updatedDocuments.push(existingDoc);
      } else {
        const newDoc = await holiday.create({
          tenantId,
          holiday_type,
          holiday_name,
          date,
          doc_type: file.mimetype,
          image: file.filename,
          createdBy: req.users?.id,
          updatedBy: req.users?.id,
          status: status || "active",
        });
        // updatedDocuments.push(newDoc);
      }
    }

    return Helper.response(
      true,
      "Documents updated successfully",
      {},
      res,
      200
    );
  } catch (error) {
    console.error("Error updating documents:", error);
    Helper.deleteUploadedFiles(req.files);
    return Helper.response(false, error?.message, null, res, 500);
  }
};

exports.deleteHoliday = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !id) {
      return Helper.response(
        false,
        "Tenant ID And ID are required",
        null,
        res,
        400
      );
    }

    const delteholiday = await holiday.findOne({ where: { id: id, tenantId } });

    if (!delteholiday) {
      return Helper.response(false, "Document not found", null, res, 404);
    }

    const filePath = path.join(
      __dirname,
      "../../../upload",
      delteholiday.image
    );
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error deleting file ${delteholiday.image}:`, err);
      }
    }

    await delteholiday.destroy();

    return Helper.response(
      true,
      "Holiday deleted successfully",
      null,
      res,
      200
    );
  } catch (error) {
    console.error("Error deleting document:", error);
    return Helper.response(false, error?.message, null, res, 500);
  }
};
