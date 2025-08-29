const empPersonal = require("../../models/empPersonal");
const Helper = require("../../helper/helper");
const path = require("path");
const fs = require("fs");
const EmploymentType = require("../../models/employmentType");
const Prefix = require("../../models/prefix");
const { Op } = require("sequelize");
const designation = require("../../models/designation");
const attendance = require("../../models/attendance");
const bill = require("../../models/bill");
const bill_info = require("../../models/bill_info");
const leave_application = require("../../models/leave_application");
const Basic = require("../../models/basic");
const Allowance = require("../../models/allowance");
const deduction = require("../../models/deductions");
const document = require("../../models/documents");
const bankAccnt = require("../../models/bankAccnt");
const leave_balance = require("../../models/leaveBalance");
exports.createEmp = async (req, res) => {
  const {
    firstName,
    lastName,
    mobile,
    email,
    permanentAddress,
    alternateMobile,
    currentAddress,
    dateOfBirth,
    age,
    gender,
    martialStatus,
    adhaarNo,
    panNo,
    fatherName,
    motherName,
    bloodGroup,
    nationality,
    pinCode,
    city,
    country,
    state,
    status,
    empCode,
    empType,
    designationId,
    departmentId,
    joiningDate,
    reportingPersonId
  } = req.body;

  const image = req.file ? req.file.filename : null;
  const tenantId = req.users && req.users.tenantId;

  if (
    !tenantId ||
    !firstName ||
    !lastName ||
    !email ||
    !mobile ||
    !dateOfBirth ||
    !age ||
    !gender ||
    !martialStatus ||
    !adhaarNo ||
    !panNo ||
    !fatherName ||
    !motherName ||
    !bloodGroup ||
    !nationality ||
    !pinCode ||
    !state ||
    !empType ||
    !departmentId ||
    !designationId ||
    !joiningDate
  ) {
    return Helper.response(false, "All fields must be provided", [], res, 400);
  }

  if (!Helper.isValidEmail(email)) {
    return Helper.response(false, "Invalid email format", [], res, 400);
  }

  if (!Helper.isValidAadhaar(adhaarNo)) {
    return Helper.response(
      false,
      "Invalid Aadhaar number format",
      [],
      res,
      400
    );
  }

  if (!Helper.isValidPAN(panNo)) {
    return Helper.response(false, "Invalid PAN number format", [], res, 400);
  }

  if (!Helper.isValidMobile(mobile)) {
    return Helper.response(false, "Invalid mobile number format", [], res, 400);
  }

  if (!Helper.isValidDOB(dateOfBirth)) {
    return Helper.response(
      false,
      "DOB must be in dd/mm/yyyy format",
      [],
      res,
      400
    );
  }

  if (!Helper.isAgeAbove18(age)) {
    return Helper.response(false, "Age must be 18 or above", [], res, 400);
  }

  const allowedGender = empPersonal.rawAttributes.gender.values;

  if (!allowedGender.includes(gender)) {
    return Helper.response(
      false,
      `Gender must be one of: ${allowedGender.join(", ")}`,
      {},
      res,
      400
    );
  }

  const allowedMartialStatus = empPersonal.rawAttributes.martialStatus.values;
  if (!allowedMartialStatus.includes(martialStatus)) {
    return Helper.response(false, "Marital Status is required", {}, res, 400);
  }

  const allowedBloodGroups = empPersonal.rawAttributes.bloodGroup.values;
  if (!allowedBloodGroups.includes(bloodGroup)) {
    return Helper.response(
      false,
      `Blood Group must be one of: ${allowedBloodGroups.join(", ")}`,
      {},
      res,
      400
    );
  }

  try {
    const maxuser = await empPersonal.count({tenantId});
    const getprefix = await Prefix.findOne({
      where: {
        tenantId,
        status: "active",
      },
    });

    const empCode = `${getprefix.name}${(maxuser + 1)
      .toString()
      .padStart(4, "0")}`;

    const newEmp = await empPersonal.create({
      tenantId,
      firstName,
      lastName,
      mobile,
      alternateMobile,
      email,
      permanentAddress,
      currentAddress,
      dateOfBirth: new Date(dateOfBirth.split("/").reverse().join("-")),
      age,
      gender,
      reportingPersonId,
      martialStatus,
      adhaarNo,
      panNo,
      fatherName,
      motherName,
      bloodGroup,
      nationality,
      pinCode,
      joiningDate,
      empCode,
      departmentId,
      designationId,
      state,
      city,
      country,
      status: status || "active",
      createdBy: req.users && req.users.id,
      updatedBy: req.users && req.users.id,
      profileImage: image,
      empCode,
      empType: empType,
    });

    return Helper.response(
      true,
      "Employee created successfully",
      newEmp,
      res,
      201
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return Helper.response(false, error?.errors[0]?.message, error, res, 500);
  }
};

exports.getEmp = async (req, res) => {
  const tenantId = req.users && req.users.tenantId;
  const { email } = req.body || {};

  try {
    if (!tenantId) {
      return Helper.response(false, "Tenant ID is required", [], res, 400);
    }

    const totalEmployee = await empPersonal.count({ where: { tenantId } });
   
    const ActiveEmployee = await empPersonal.count({
      where: { tenantId, status: "active" },
    });
   
    const InactiveEmployee = await empPersonal.count({
      where: { tenantId, status: "inactive" },
    });
   
    const newJoiners = await empPersonal.count({
      where: {
        tenantId,
        status: "active",
        createdAt: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });
 
    const cardData = {
      totalEmployee,
      ActiveEmployee,
      InactiveEmployee,
      newJoiners,
    };

    if (email) {
      const emp = await empPersonal.findOne({
        where: { email, tenantId },
      });

      if (!emp) {
        return Helper.response(false, "Employee not found", [], res, 404);
      }
      const emptypes = await EmploymentType.findOne({
        where: { id: emp.empType, tenantId },
      });
      const formattedEmp = {
        ...emp.toJSON(),
        createdAt: Helper.formatToIST(emp.createdAt, "YYYY-MM-DD HH:mm:ss"),
        emptypename: emptypes ? emptypes.name : null,
      };

      return Helper.response(
        true,
        "Employee fetched successfully",
        {
          formattedEmp,
          cardData,
        },
        res,
        200
      );
    } else {
      const emps = await empPersonal.findAll({
        raw: true,
        where: { tenantId },
        order: [["createdAt", "DESC"]],
      });

      const formattedEmps = await Promise.all(
        emps.map(async (emp, i) => {
          const emptypes = await EmploymentType.findOne({
            where: { id: emp.empType, tenantId },
          });
          return {
            ...emp,
            createdAt: Helper.formatToIST(emp.createdAt, "YYYY-MM-DD HH:mm:ss"),
            emptypename: emptypes ? emptypes.name : null,
            designation: emp.designationId ? await designation.findOne(
              {
                where: { id: emp.designationId, tenantId },
                attributes: ['name'],
                raw: true,
              })?.name : null
      
          };
        })
      );

      return Helper.response(
        true,
        "Employees fetched successfully",
        { formattedEmps, cardData },
        res,
        200
      );
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};

exports.updateEmp = async (req, res) => {
  const {
    id,
    firstName,
    lastName,
    mobile,
    email,
    permanentAddress,
    alternateMobile,
    currentAddress,
    dateOfBirth,
    age,
    gender,
    martialStatus,
    adhaarNo,
    panNo,
    fatherName,
    motherName,
    bloodGroup,
    nationality,
    pinCode,
    country,
    city,
    empType,
    state,
    status,
  } = req.body;

  const image = req.file ? req.file.filename : null;

  const tenantId = req.users && req.users.tenantId;
  try {
    const existingEmp = await empPersonal.findOne({ where: { id, tenantId } });

    if (!existingEmp) {
      return Helper.response(false, "Employee not found", [], res, 404);
    }

    if (!id || !tenantId) {
      return Helper.response(
        false,
        "id and tenetId must be provided",
        [],
        res,
        400
      );
    }

    if (email && !Helper.isValidEmail(email)) {
      return Helper.response(false, "Invalid email format", [], res, 400);
    }

    if (adhaarNo && !Helper.isValidAadhaar(adhaarNo)) {
      return Helper.response(
        false,
        "Invalid Aadhaar number format",
        [],
        res,
        400
      );
    }

    if (panNo && !Helper.isValidPAN(panNo)) {
      return Helper.response(false, "Invalid PAN number format", [], res, 400);
    }

    if (mobile && !Helper.isValidMobile(mobile)) {
      return Helper.response(
        false,
        "Invalid mobile number format",
        [],
        res,
        400
      );
    }

    if (dateOfBirth && !Helper.isValidDOB(dateOfBirth)) {
      return Helper.response(
        false,
        "DOB must be in dd/mm/yyyy format",
        [],
        res,
        400
      );
    }

    if (age && !Helper.isAgeAbove18(age)) {
      return Helper.response(false, "Age must be 18 or above", [], res, 400);
    }

    if (gender) {
      const allowedGender = empPersonal.rawAttributes.gender.values;
      if (!allowedGender.includes(gender)) {
        return Helper.response(
          false,
          `Gender must be one of: ${allowedGender.join(", ")}`,
          {},
          res,
          400
        );
      }
    }

    if (martialStatus) {
      const allowedMartialStatus =
        empPersonal.rawAttributes.martialStatus.values;
      if (!allowedMartialStatus.includes(martialStatus)) {
        return Helper.response(
          false,
          `Marital Status must be one of: ${allowedMartialStatus.join(", ")}`,
          {},
          res,
          400
        );
      }
    }

    if (bloodGroup) {
      const allowedBloodGroups = empPersonal.rawAttributes.bloodGroup.values;
      if (!allowedBloodGroups.includes(bloodGroup)) {
        return Helper.response(
          false,
          `Blood Group must be one of: ${allowedBloodGroups.join(", ")}`,
          {},
          res,
          400
        );
      }
    }

    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (mobile) updateData.mobile = mobile;
    if (email) updateData.email = email;
    if (dateOfBirth)
      updateData.dateOfBirth = new Date(
        dateOfBirth.split("/").reverse().join("-")
      );
    if (age) updateData.age = age;
    if (gender) updateData.gender = gender;
    if (martialStatus) updateData.martialStatus = martialStatus;
    if (adhaarNo) updateData.adhaarNo = adhaarNo;
    if (panNo) updateData.panNo = panNo;
    if (fatherName) updateData.fatherName = fatherName;
    if (motherName) updateData.motherName = motherName;
    if (bloodGroup) updateData.bloodGroup = bloodGroup;
    if (nationality) updateData.nationality = nationality;
    if (pinCode) updateData.pinCode = pinCode;
    if (state) updateData.state = state;
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    if (status) updateData.status = status;
    if (permanentAddress) updateData.permanentAddress = permanentAddress;
    if (alternateMobile) updateData.alternateMobile = alternateMobile;
    if (currentAddress) updateData.currentAddress = currentAddress;
    if (image) updateData.profileImage = image;
    if (empType) updateData.empType = empType;

    updateData.updatedBy = req.users && req.users.id;

    await existingEmp.update(updateData);

    return Helper.response(
      true,
      "Employee updated successfully",
      existingEmp,
      res,
      200
    );
  } catch (error) {
    console.error("Error updating employee:", error);
    return Helper.response(false, "Internal server error", [], res, 500);
  }
};

exports.deleteEmp = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users && req.users.tenantId;

  try {
    if (!id || !tenantId) {
      return Helper.response(
        false,
        "id and tenantId must be provided",
        [],
        res,
        400
      );
    }

    const emp = await empPersonal.findOne({ where: { id, tenantId } });

    if (!emp) {
      return Helper.response(false, "Employee not found", [], res, 404);
    }
     await attendance.destroy({ where: { employeeId:id, tenantId } });
     await bill.destroy({ where: { employeeId:id,tenantId } });
     await bill_info.destroy({ where: { employeeId: id, tenantId } });
     await leave_application.destroy({ where: { employeeId: id, tenantId } });
     await Basic.destroy({ where: { employeeId: id,tenantId } });
     await Allowance.destroy({ where: { employeeId:id, tenantId } });
    //  await deduction.destroy({ where: {employeeId: id, tenantId } });
    //  await deduction.destroy({ where: { employeeId:id, tenantId } });
     await bankAccnt.destroy({ where: { employeeId: id, tenantId } });
     await document.destroy({ where: { employeeId: id, tenantId } });
     await leave_balance.destroy({ where: { employeeId: id, tenantId } });
    await emp.destroy();

    return Helper.response(true, "Employee deleted successfully", [], res, 200);
  } catch (error) {
    console.error("Error deleting employee:", error);
    return Helper.response(false, error?.message, [], res, 500);
  }
};

exports.uploadImage = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users && req.users.tenantId;
  const image = req.file ? req.file.filename : null;

  if (!tenantId || !id) {
    if (image) {
      const filePath = path.join(__dirname, "../../../upload", image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return Helper.response(
      false,
      "Tenant ID and Employee ID are required",
      [],
      res,
      400
    );
  }

  if (!image) {
    return Helper.response(false, "No image uploaded", [], res, 400);
  }

  try {
    const emp = await empPersonal.findOne({ where: { id, tenantId } });
    if (!emp) {
      const filePath = path.join(__dirname, "../../../upload", image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return Helper.response(false, "Employee not found", [], res, 404);
    }

    if (emp.profileImage) {
      const oldImagePath = path.join(
        __dirname,
        "../../../upload",
        emp.profileImage
      );
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          /* ignore */
        }
      }
    }

    emp.profileImage = image;
    emp.updatedBy = req.users && req.users.id;
    await emp.save();

    return Helper.response(
      true,
      "Profile image updated successfully",
      emp,
      res,
      200
    );
  } catch (error) {
    console.error("Error uploading profile image:", error);

    if (image) {
      const filePath = path.join(__dirname, "../../../upload", image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return Helper.response(false, "Internal server error", [], res, 500);
  }
};

exports.getUploadedImage = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users && req.users.tenantId;

  if (!tenantId || !id) {
    return Helper.response(
      false,
      "Tenant ID and Employee ID are required",
      [],
      res,
      400
    );
  }

  try {
    const emp = await empPersonal.findOne({
      where: { id, tenantId, status: "active" },
    });
    if (!emp) {
      return Helper.response(false, "Employee not found", [], res, 404);
    }

    if (!emp.profileImage) {
      return Helper.response(
        false,
        "No profile image found for this employee",
        [],
        res,
        404
      );
    }

    const imagePath = path.join(__dirname, "../../../upload", emp.profileImage);
    if (fs.existsSync(imagePath)) {
      return Helper.response(
        true,
        "Profile image fetched successfully",
        emp.profileImage,
        res,
        200
      );
    } else {
      return Helper.response(
        false,
        "Profile image file does not exist",
        [],
        res,
        404
      );
    }
  } catch (error) {
    console.error("Error fetching profile image:", error);
    return Helper.response(false, "Internal server error", [], res, 500);
  }
};

exports.employeeList = async (req, res) => {
  const tenantId = req.users && req.users.tenantId;
  try {
    if (!tenantId) {
      return Helper.response(false, "TenantId is required!", {}, res, 200);
    }
    const employees = await empPersonal.findAll({
      where: {
        tenantId,
      },
      attributes: ["id", "firstName", "lastName"],
      order: [["firstName", "ASC"]],
    });

    const dropdown = [
      { label: "All", value: "All" },
      ...employees.map((emp) => ({
        label: `${emp.firstName} ${emp.lastName}`,
        value: emp.id,
      })),
    ];

    return Helper.response(
      true,
      "Employee list Fetched Successfully!",
      dropdown,
      res,
      200
    );
  } catch (error) {
    console.error("Error fetching employee list:", error);
    return Helper.response(false, "Internal server error", [], res, 500);
  }
};
