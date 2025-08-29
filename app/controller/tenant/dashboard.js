// const deduction = require("../../models/deductions");
const Helper = require("../../helper/helper");
const attendance = require("../../models/attendance");
const empPersonal = require("../../models/empPersonal");
const { Sequelize } = require("sequelize");
const Department = require("../../models/department.js");
const designation = require("../../models/designation.js");
const holiday = require("../../models/holiday.js");
const holidayType = require("../../models/HolidayType.js");
const leave_Application = require("../../models/leave_application.js");
const leave_master = require("../../models/leaveMaster.js");
const { Op } = require("sequelize");
exports.getDashboardData = async (req, res) => {
  try {
    const { tenantId } = req.users;
    if (!tenantId) {
      return Helper.response(false, "TenantId Is Required", {}, res, 400);
    }

    const badgeColors = ["primary", "warning", "info", "danger", "success"];
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayDate = `${todayYear}-${todayMonth}-${todayDay}`;

    // Parallelize all queries that don’t depend on each other
    const [
      Totalemployee,
      ActiveEmployee,
      totalMonthlyAttendance,
      todayAttendance,
      allDepartment,
      employeesCount,
      totalEmpList,
      HolidayList,
      leaveApplication,
      Birthdayemployees,
      Joiningemployees,
    ] = await Promise.all([
      empPersonal.count({ where: { tenantId } }),
      empPersonal.count({ where: { tenantId, status: "active" } }),
      attendance.count({ where: { month: todayMonth, year: todayYear, tenantId } }),
      attendance.count({ where: { date: todayDate, tenantId } }),
      Department.findAll({
        where: { tenantId, status: "active" },
        attributes: ["id", "name"],
        raw: true,
      }),
      empPersonal.findAll({
        where: { tenantId, status: "active" },
        attributes: [
          "designationId",
          [Sequelize.fn("COUNT", Sequelize.col("empPersonal.id")), "count"],
        ],
        group: ["designationId"],
        raw: true,
        limit: 5,
      }),
      empPersonal.findAll({
        where: { tenantId, status: "active" },
        attributes: ["id", "firstName", "lastName", "designationId"],
        raw: true,
        limit: 5,
      }),
      holiday.findAll({
        where: { tenantId, status: "active" },
        order: [["createdAt", "desc"]],
        limit: 5,
        raw: true,
      }),
      leave_Application.findAll({
        where: { tenantId },
        order: [["createdAt", "desc"]],
        limit: 5,
        raw: true,
      }),
      empPersonal.findAll({
        where: { tenantId, dateOfBirth: { [Op.ne]: null } },
        attributes: ["id", "firstName", "lastName", "designationId", "dateOfBirth"],
        raw: true,
        limit: 5,
      }),
      empPersonal.findAll({
        where: { tenantId, joiningDate: { [Op.ne]: null } },
        attributes: ["id", "firstName", "lastName", "designationId", "joiningDate"],
        raw: true,
        limit: 5,
      }),
    ]);

    // Chart data
    const categories = allDepartment.map((d) => d.name);
    const values = allDepartment.map((d) => {
      const found = employeesCount.find((c) => c.designationId === d.id);
      return found ? parseInt(found.count, 10) : 0;
    });

    const chartOptions = {
      series: [{ name: "basic", data: values }],
      chart: { type: "bar", height: 320 },
      plotOptions: { bar: { horizontal: true, distributed: true } },
      dataLabels: { enabled: false },
      xaxis: { categories },
      colors:  [
        "#154D71", "#005890", "#3357FF", "#1c6ea4",
        "#33a1e0","#3498DB",
      ],
    };

    // Employees (avoid N+1 → batch fetch designations)
    const desigMap = Object.fromEntries(allDesignation.map(d => [d.id, d.name]));
    const employees = totalEmpList.map((emp, index) => ({
      name: `${emp.firstName} ${emp.lastName}`,
      role: desigMap[emp.designationId] || "N/A",
      badge: desigMap[emp.designationId] || "N/A",
      badgeColor: badgeColors[index % badgeColors.length],
    }));

    // Holidays
    const holidayTypeIds = HolidayList.map(h => h.holiday_type);
    const holidayTypes = await holidayType.findAll({
      where: { id: holidayTypeIds, tenantId, status: "active" },
      attributes: ["id", "name"],
      raw: true,
    });
    const holidayMap = Object.fromEntries(holidayTypes.map(ht => [ht.id, ht.name]));
    const holidays = HolidayList.map(h => ({
      name: h.holiday_name,
      type: holidayMap[h.holiday_type] || "N/A",
      date: h.date,
      image: h.image,
    }));

    // Leaves
    const leaveTypeIds = leaveApplication.map(l => l.leaveTypeId);
    const empIds = leaveApplication.map(l => l.employeeId);

    const [leaveTypes, leaveEmployees] = await Promise.all([
      leave_master.findAll({
        where: { id: leaveTypeIds, tenantId },
        attributes: ["id", "leaveName"],
        raw: true,
      }),
      empPersonal.findAll({
        where: { id: empIds, tenantId },
        attributes: ["id", "firstName", "lastName", "empCode"],
        raw: true,
      }),
    ]);

    const leaveMap = Object.fromEntries(leaveTypes.map(l => [l.id, l.leaveName]));
    const empMap = Object.fromEntries(leaveEmployees.map(e => [e.id, e]));
    const leaves = leaveApplication.map(item => ({
      ...item,
      name: `${empMap[item.employeeId]?.firstName || ""} ${empMap[item.employeeId]?.lastName || ""}`,
      empCode: empMap[item.employeeId]?.empCode,
      type: leaveMap[item.leaveTypeId] || "N/A",
    }));

    // Birthdays (this month)
    const birthdays = Birthdayemployees.filter(emp => {
      const dob = new Date(emp.dateOfBirth);
      return dob.getMonth() + 1 === todayMonth;
    }).map((emp, index) => ({
      ...emp,
      badgeColor: badgeColors[index % badgeColors.length],
      designationName: desigMap[emp.designationId] || "No Designation",
    }));

    // Anniversaries (joining date anniversary today)
    const anniversaries = Joiningemployees.filter(emp => {
      const joiningDate = new Date(emp.joiningDate);
      return joiningDate.getDate() === todayDay && joiningDate.getMonth() + 1 === todayMonth;
    }).map((emp, index) => ({
      ...emp,
      badgeColor: badgeColors[index % badgeColors.length],
      designationName: desigMap[emp.designationId] || "No Designation",
    }));

    // Final Response
    const data = {
      stats: [
        { title: "Total Employees", value: `${ActiveEmployee}/${Totalemployee}`, icon: "ri-group-line",icon_color:'primary', color: "#154D71", link: "/employees" },
        { title: "Monthly Attendance Overview", value: `${totalMonthlyAttendance}/${Totalemployee}`,icon_color:'primary', icon: "ri-alert-line", color: "#005890", link: "/attendance" },
        { title: "Job Applicants", value: "27",icon_color:'primary', icon: "ri-route-line", color: "#1c6ea4", link: "/applicants" },
        { title: "Today's Attendance", value: `${todayAttendance}/${Totalemployee}`,icon_color:'primary', icon: "ri-time-line", color: "#33a1e0", link: "/attendance/today" },
      ],
      chartOptions,
      employees,
      holidays,
      leaves,
      anniversaries,
      birthdays,
    };
  return Helper.response(true, 'Data Found Successfully', data, res, 200);
  } catch (error) {
      return Helper.response(false, error?.message, {}, res, 500);
  }
};
