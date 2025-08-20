const Basic = require("../../models/basic");
const Helper = require("../../helper/helper");
const empPersonal = require("../../models/empPersonal");

exports.createBasic = async (req, res) => {
  const {
    employeeId,
    name,
    type,
    typeValue,
    dependent,
    finalAmount,
    amount,
    status,
    startDate,
  } = req.body;

  const tenantId = req.users && req.users.tenantId;
  const userId = req.users && req.users.id;

  if (!tenantId || !employeeId) {
    return Helper.response(
      false,
      "TenantId and employeeId required",
      [],
      res,
      400
    );
  }

  const emloyeeExist = await empPersonal.findOne({
    where: { id: employeeId, tenantId, status: 'active' },
  });

  if (!emloyeeExist) {
    return Helper.response(false, "Employee does not exist", [], res, 400);
  }

  if (!name || !type || !typeValue || !dependent || !amount) {
    return Helper.response(
      false,
      "All required fields must be provided",
      [],
      res,
      400
    );
  }

  if (startDate && !Helper.formatToIST(startDate)) {
    return Helper.response(false, "Invalid startDate format. Use YYYY-MM-DD", [], res, 400);
  }


  try {
    const basic = await Basic.create({
      tenantId,
      employeeId,
      name,
      type,
      typeValue,
      dependent,
      amount,
      finalAmount,
      status: status || "active",
      startDate: Helper.formatToIST(startDate),
      createdBy: userId,
      updatedBy: userId,
    });

    return Helper.response(
      true,
      "Basic record created successfully",
      basic,
      res,
      201
    );
  } catch (err) {
    console.error("Error in createBasic:", err);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};

exports.getBasic = async (req, res) => {
  const tenantId = req.users && req.users.tenantId;
  const { employeeId } = req.body;


  try {
    if (!tenantId) {
      return Helper.response(false, "Tenant ID is required", [], res, 400);
    }
    if (!employeeId) {
      return Helper.response(false, "employee ID is required", [], res, 400);
    }



    const emloyeeExist = empPersonal.findOne({
      where: { id: employeeId, tenantId, status: 'active' },
    });

    if (!emloyeeExist) {
      return Helper.response(false, "Employee does not exist", [], res, 400);
    }
    const basics = await Basic.findAll({ where: { employeeId, tenantId } });

    if (!basics) {
      return Helper.response(false, "Data does not exist", [], res, 400);
    }

    return Helper.response(
      true,
      "Basic records fetched successfully",
      basics,
      res,
      200
    );
  } catch (err) {
    console.error("Error in getBasic:", err);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};

exports.updateBasic = async (req, res) => {
  const {
    id,
    employeeId,
    name,
    type,
    typeValue,
    dependent,
    amount,
    finalAmount,
    status,
    startDate,
  } = req.body;

  const tenantId = req.users && req.users.tenantId;
  const userId = req.users && req.users.id;


  try {
    const emloyeeExist = empPersonal.findOne({
      where: { id: employeeId, tenantId, status: 'active' },
    });

    if (!emloyeeExist) {
      return Helper.response(false, "Employee does not exist", [], res, 400);
    }

    if (startDate && !Helper.formatToIST(startDate)) {
      return Helper.response(false, "Invalid startDate format. Use YYYY-MM-DD", [], res, 400);
    }

    if (!tenantId || !id || !employeeId) {
      return Helper.response(
        false,
        "EmployeeId, ID and Tenant ID are required",
        [],
        res,
        400
      );
    }
    const basic = await Basic.findOne({ where: { id, employeeId, tenantId } });

    if (!basic) {
      return Helper.response(false, "Basic record not found", [], res, 404);
    }


    if (name) basic.name = name;
    if (type) basic.type = type;
    if (typeValue !== undefined) basic.typeValue = typeValue;
    if (dependent) basic.dependent = dependent;
    if (amount !== undefined) basic.amount = amount;
    basic.finalAmount = finalAmount;
    if (status) basic.status = status;
    if (startDate) basic.startDate = Helper.formatToIST(startDate);

    basic.updatedBy = userId;

    await basic.save();

    return Helper.response(
      true,
      "Basic record updated successfully",
      basic,
      res,
      200
    );
  } catch (err) {
    console.error("Error in updateBasic:", err);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};

exports.deleteBasic = async (req, res) => {
  const { id } = req.body;
  const tenantId = req.users && req.users.tenantId;

  if (!id || !tenantId) {
    return Helper.response(
      false,
      "ID and Tenant ID are required",
      [],
      res,
      400
    );
  }

  try {
    const basic = await Basic.findOne({ where: { id, tenantId } });

    if (!basic) {
      return Helper.response(false, "Basic record not found", [], res, 404);
    }

    await basic.destroy();

    return Helper.response(
      true,
      "Basic record deleted successfully",
      [],
      res,
      200
    );
  } catch (err) {
    console.error("Error in deleteBasic:", err);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
};

exports.getBasicById = async (req, res) => {
  const { employeeId } = req.body;
  const tenantId = req.users && req.users.tenantId;

  if (!employeeId || !tenantId) {
    return Helper.response(false, "employeeId and Tenant ID are required", [], res, 400);
  }

  try {
    const basic = await Basic.findOne({ where: { employeeId, tenantId } });

    if (!basic) {
      return Helper.response(false, "Basic record not found", [], res, 404);
    }

    const basicData = {
      value: basic.id,
      label: basic.name,
      finalAmount: basic.finalAmount,
    }

    return Helper.response(
      true,
      "Basic record fetched successfully",
      basicData,
      res,
      200
    );
  } catch (err) {
    console.error("Error in getBasicById:", err);
    return Helper.response(false, "Internal Server Error", [], res, 500);
  }
}
