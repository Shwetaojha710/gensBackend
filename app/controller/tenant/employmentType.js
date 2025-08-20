const EmploymentType = require('../../models/employmentType');
const Helper = require('../../helper/helper');

exports.createEmploymentType = async (req, res) => {
    const { name, status } = req.body;
    const tenantId = req.users && req.users.tenantId;
    try {

        const allowedNames = EmploymentType.rawAttributes.name.values;

        if (!name) {
            return Helper.response(false, "Name is required", {}, res, 400);
        }

        if (!allowedNames.includes(name)) {
            return Helper.response(false, `Name must be one of: ${allowedNames.join(', ')}`, {}, res, 400);
        }

        const employmentTypeData = await EmploymentType.create({
            tenantId,
            name,
            status: status || 'active',
            createdBy: req.users && req.users.id,
            updatedBy: req.users && req.users.id
        });

        return Helper.response(true, "Employment Type created successfully", employmentTypeData, res, 201);
    } catch (error) {
        return Helper.response(false, error.message || "Something went wrong", {}, res, 500);
    }
}
exports.getEmploymentTypes = async (req, res) => {
    const tenantId = req.users && req.users.tenantId;
    const { name } = req.body || {};

    try {
        if (!tenantId) {
            return Helper.response(false, "Tenant ID is required", [], res, 400);
        }

        if (name) {
            const employmentType = await EmploymentType.findOne({
                where: { name, tenantId }
            });

            if (!employmentType) {
                return Helper.response(false, "Employment Type not found", [], res, 404);
            }

            const formatted = {
                ...employmentType.toJSON(),
                createdAt: Helper.formatToIST(employmentType.createdAt, 'YYYY-MM-DD HH:mm:ss')
            };

            return Helper.response(true, "Employment Type fetched successfully", formatted, res, 200);
        } else {
            const employmentTypes = await EmploymentType.findAll({
                where: { tenantId },
                order: [['createdAt', 'DESC']]
            });

            const data = employmentTypes.map(emp => ({
                ...emp.toJSON(),
                createdAt: Helper.formatToIST(emp.createdAt, 'YYYY-MM-DD HH:mm:ss')
            }));

            return Helper.response(true, "Employment Types fetched successfully", data, res, 200);
        }
    } catch (error) {
        console.error("Error in getEmploymentTypes:", error);
        return Helper.response(false, error.message || "Something went wrong", [], res, 500);
    }
};


exports.editEmploymentType = async (req, res) => {
    const { id, name, status } = req.body;
    const tenantId = req.users && req.users.tenantId;
    try {
        if (!id || !tenantId) {
            return Helper.response(false, "Employment Type ID and Tenant ID are required", {}, res, 400);
        }

        const employmentType = await EmploymentType.findOne({ where: { id, tenantId } });
        if (!employmentType) {
            return Helper.response(false, "Employment Type not found", {}, res, 404);
        }


        employmentType.name = name;

        employmentType.status = status || employmentType.status;
        employmentType.updatedBy = req.users && req.users.id;

        await employmentType.save();

        return Helper.response(true, "Employment Type updated successfully", employmentType, res, 200);
    } catch (error) {
        return Helper.response(false, error.message || "Something went wrong", {}, res, 500);
    }
}

exports.deleteEmploymentType = async (req, res) => {
    const { id } = req.body;
    const tenantId = req.users && req.users.tenantId;
    try {
        if (!id || !tenantId) {
            return Helper.response(false, "Employment Type ID and Tenant ID are required", {}, res, 400);
        }

        const employmentType = await EmploymentType.findOne({ where: { id, tenantId } });
        if (!employmentType) {
            return Helper.response(false, "Employment Type not found", {}, res, 404);
        }

        await employmentType.destroy();

        return Helper.response(true, "Employment Type deleted successfully", {}, res, 200);
    } catch (error) {
        return Helper.response(false, error.message || "Something went wrong", {}, res, 500);
    }
}

exports.getEmpDD = async (req, res) => {
      const tenantId = req.users && req.users.tenantId;
    try {
       if (!tenantId) {
            return Helper.response(false, "Tenant ID is required", [], res, 400);
        }
        const employmentTypes = await EmploymentType.findAll({
          where: { status: 'active' ,tenantId},
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });

        if (employmentTypes.length === 0) {
            return Helper.response(false, "No Employment Types found", [], res, 404);
        }

        const formattedEmploymentTypes = employmentTypes.map(emp => ({
            value: emp.id,
            label: emp.name
        }));

        return Helper.response(true, "Employment Types dropdown fetched successfully", formattedEmploymentTypes, res, 200);
    } catch (error) {
        console.error("Error fetching Employment Types dropdown:", error);
        return Helper.response(false, "Internal server error", [], res, 500);
    }
}
