const Shift = require("../../models/shift");
const Helper = require("../../helper/helper");
const attendance = require("../../models/attendance");
const moment = require("moment");

exports.createShift = async (req, res) => {
  const data = req.body;
  const tenantId = req.users && req.users.tenantId;

  const arrayPush = [];

  for (const item of data) {
    const startTime = item.startTime;
    const endTime = item.endTime;
    const isWeekOff = (item.startTime == "00:00:00" && item.endTime == "00:00:00") ? true : false;

    let workingHours = 0;
    if (!isWeekOff) {
      const moment = require('moment');
      const start = moment(startTime, "HH:mm:ss");
      let end = moment(endTime, "HH:mm:ss");

      if (end.isBefore(start)) {
        end.add(1, 'day');
      }

      workingHours = moment.duration(end.diff(start)).asHours();
    }

    const values = {
      day_of_week: item.day_of_week,
      shift: item.shift,
      startTime: startTime,
      endTime: endTime,
      tenantId: tenantId,
      createdBy: req.users && req.users.id,
      is_week_off: isWeekOff,
      workingHours: workingHours,
      status: isWeekOff ? 'inactive' : 'active',
    };

    arrayPush.push(values);
  }

  if (!arrayPush || arrayPush.length === 0) {
    return Helper.response(false, "No shifts provided", [], res, 400);
  }

  try {
    const newShift = await Shift.bulkCreate(arrayPush);
    return Helper.response(true, "Shift created successfully", newShift, res, 201);
  } catch (error) {
    console.error("Error creating shift:", error);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};


exports.getShift = async (req, res) => {
  const tenantId = req.users && req.users.tenantId;

  try {
    const shifts = await Shift.findAll({
      where: { tenantId },
      raw: true,
      order: [['shift', 'ASC'], ['day_of_week', 'ASC']],
    });

    const grouped = shifts.reduce((acc, shift) => {
      const group = acc.find(g => g.shift === shift.shift);
      if (group) {
        group.shifts.push(shift);
      } else {
        acc.push({
          shift: shift.shift,
          shifts: [shift]
        });
      }
      return acc;
    }, []);

    return Helper.response(true, "Shifts grouped by shift name", grouped, res, 200);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};

exports.updateShift = async (req, res) => {
  const { id, shift, startTime, endTime, status } = req.body;
  const tenantId = req.users && req.users.tenantId;

  if (!id || !tenantId) {
    return Helper.response(false, "Shift ID and Tenant ID are required", [], res, 400);
  }

  try {
    const shiftToUpdate = await Shift.findOne({ where: { id, tenantId } });

    if (!shiftToUpdate) {
      return Helper.response(false, "Shift not found", [], res, 404);
    }

    if (shift) {
      return Helper.response(false, "Shift type cannot be updated once created.", [], res, 400);
    }

    if (startTime) shiftToUpdate.startTime = startTime;
    if (endTime) shiftToUpdate.endTime = endTime;
    if (status) shiftToUpdate.status = status;
    shiftToUpdate.updatedBy = req.users && req.users.id;

    await shiftToUpdate.save();

    const formattedShift = Helper.formatShiftTime(shiftToUpdate);
    return Helper.response(true, "Shift updated successfully", formattedShift, res, 200);
  } catch (error) {
    console.error("Error updating shift:", error);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};

exports.deleteShift = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users && req.users.tenantId;

  if (!id || !tenantId) {
    return Helper.response(false, "Shift ID and Tenant ID are required", [], res, 400);
  }

  try {
    const shiftToDelete = await Shift.findOne({ where: { id, tenantId } });

    if (!shiftToDelete) {
      return Helper.response(false, "Shift not found", [], res, 404);
    }

    await shiftToDelete.destroy();
    return Helper.response(true, "Shift deleted successfully", [], res, 200);
  } catch (error) {
    console.error("Error deleting shift:", error);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};


exports.generateDummyAttendance = async () => {
  const tenantId = '88e23215-4edf-49f8-8014-48cf4d3dd995';   // sample tenant
  const employeeId = '02cfad87-8201-4115-9249-e15c2f8f066d'; // sample employee
  const createdBy = employeeId;
  const updatedBy = employeeId;

  const attendances = [];

  for (let day = 1; day <= 31; day++) {
    const date = moment(`2025-08-${day}`, "YYYY-MM-DD");

    // Skip Sundays (or Saturdays+Sundays if required)
    //if (date.day() === 0) continue; // Sunday only
    if (date.day() === 0 || date.day() === 6) continue; // uncomment for Sat+Sun off

  
    const checkIn = moment(`${date.format('YYYY-MM-DD')} 09:00 AM`, "YYYY-MM-DD hh:mm A").format("YYYY-MM-DD HH:mm:ss");
    const checkOut = moment(`${date.format('YYYY-MM-DD')} 06:30 PM`, "YYYY-MM-DD hh:mm A").format("YYYY-MM-DD HH:mm:ss");

    attendances.push({
      tenantId,
      employeeId,
      ip_address: '192.168.1.10',
      check_in_time: checkIn,
      check_out_time: checkOut,
      is_present: true,
      date:date.format('YYYY-MM-DD'),
      month:new Date(date).getMonth()+1,
      year:new Date(date).getFullYear(),
      createdBy,
      updatedBy,
    });
  }

  try {
    await attendance.bulkCreate(attendances);
    console.log(`Inserted ${attendances.length} attendance records for June.`);
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    console.error('Error inserting dummy data:');
  }
};
