const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");
const db = require("../connection/connection");
const fs = require('fs');
const path = require('path');

const Helper = {};

Helper.basicAmountCalc = (amount, typeValue) => {
  return parseFloat(((amount || 0) * (typeValue || 0)) / 100);
};

Helper.deleteUploadedFiles = (files) => {
  if (!files || typeof files !== 'object') return;

  try {
    for (const key in files) {
      const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];

      for (const file of fileArray) {
        if (file?.filename) {
          const filePath = path.join(__dirname, '../../../upload', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error deleting uploaded files:', err);
  }
};
Helper.getCurrentDate = () => {
  const date = new Date();
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return date.toLocaleDateString("en-IN", options).replace(/\//g, "-");
};


Helper.formatToIST = (
  datetime = new Date(),
  format = "YYYY-MM-DD HH:mm:ss"
) => {
  return moment(datetime).tz("Asia/Kolkata").format(format);
};

Helper.response = (status, message, data = [], res, statusCode) => {
  return res.status(statusCode).json({
    status,
    message,
    data,
  });
};

Helper.verifyToken = (token) => {
  try {
    const secret = process.env.SECRET_KEY || "your_jwt_secret";
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

Helper.getDesig = async () => {
  try {
    const query = `SELECT * FROM designations`;
    const rows = await db.query(query);
    return rows[0];
  } catch (err) {
    console.error("DB Error in getDesig:", err);
    return [];
  }
};

Helper.validateAccountNumber = (accountNumber) => {
  const accountRegex = /^\d{11,14}$/;
  return accountRegex.test(accountNumber);
};

Helper.isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
Helper.isValidAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);
Helper.isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
Helper.isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);
Helper.isValidDOB = (dob) =>
  /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/.test(dob);

Helper.isAgeAbove18 = (age) => age >= 18;

Helper.formatShiftTime = (shift) => {
  if (!shift || !shift.startTime || !shift.endTime) return shift;

  const jsonShift = shift.toJSON ? shift.toJSON() : shift;

  return {
    ...jsonShift,
    startTime: moment(jsonShift.startTime, "HH:mm:ss").format("hh:mm A"),
    endTime: moment(jsonShift.endTime, "HH:mm:ss").format("hh:mm A"),
  };
};


Helper.calculateWorkingHours = (startTime, endTime) => {
  const start = moment(startTime, "HH:mm");
  const end = moment(endTime, "HH:mm");
  const durationInHours = moment.duration(end.diff(start)).asHours();
  return parseFloat(durationInHours.toFixed(2));
}

Helper.capitalizeFirstLetter = (name) => {
  if (name.length === 0) {
    return "";
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

Helper.getIpAddress = (req) => {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]
        || req.socket?.remoteAddress
        || null;

  // Remove IPv6 prefix if present
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  return ip;
};

Helper.dateFormat = (date) => {
  const istDate = new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // 12-hour format (AM/PM)
    timeZone: "Asia/Kolkata",
  });

  return istDate.replace(/\b(am|pm)\b/, (match) => match.toUpperCase());

}

Helper.applySandwichRule = (leaveRecords, holidays, startDate, endDate) => {
  let updatedRecords = [...leaveRecords];

  // Convert leaveRecords into a Set of leave dates for quick lookup
  let leaveDates = new Set();
  for (const leave of leaveRecords) {
    let start = moment(leave.fromDate);
    let end = moment(leave.toDate);
    for (let d = moment(start); d <= end; d.add(1, "days")) {
      leaveDates.add(d.format("YYYY-MM-DD"));
    }
  }

  for (let d = moment(startDate); d <= endDate; d.add(1, "days")) {
    const dateKey = d.format("YYYY-MM-DD");

    // skip if already leave
    if (leaveDates.has(dateKey)) continue;

    const isHoliday = holidays.includes(dateKey) || d.day() === 0 || d.day() === 6;
    if (!isHoliday) continue;

    // find nearest previous leave
    let prev = moment(d).subtract(1, "days");
    while (prev >= startDate) {
      const prevKey = prev.format("YYYY-MM-DD");
      if (leaveDates.has(prevKey)) break;
      if (!(holidays.includes(prevKey) || prev.day() === 0 || prev.day() === 6)) {
        prev = null;
        break;
      }
      prev.subtract(1, "days");
    }

    // find nearest next leave
    let next = moment(d).add(1, "days");
    while (next <= endDate) {
      const nextKey = next.format("YYYY-MM-DD");
      if (leaveDates.has(nextKey)) break;
      if (!(holidays.includes(nextKey) || next.day() === 0 || next.day() === 6)) {
        next = null;
        break;
      }
      next.add(1, "days");
    }

    // if leave exists on both sides → mark as sandwich leave
    if (prev && next) {
      updatedRecords.push({
        id: null,
        employeeId: leaveRecords[0].employeeId,
        leaveTypeId: null,
        fromDate: dateKey,
        toDate: dateKey,
        duration_type: "full",
        isSandwich: true,
       tenantId:leaveRecords[0].tenantId,
       leaveTypeId:leaveRecords[0].leaveTypeId
      });
      leaveDates.add(dateKey);
    }
  }

  return updatedRecords;
};

Helper.adjustLeaveRecords = (leaveBalanceArr, leaveRecordsArr)=> {
  const toRemove = [];

  leaveBalanceArr.forEach((balance) => {
    const allowed = balance.remainingLeaves ?? 0;

    // Find matching leave records for same employee + leaveType
    const matchingRecords = leaveRecordsArr.filter(
      (rec) =>
        rec.employeeId == balance.employeeId &&
        rec.leaveTypeId == balance.leaveTypeId &&
        balance.status == 'approved'
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
Helper.getIpAddress = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress || 
    null
  );
};

module.exports = Helper;
