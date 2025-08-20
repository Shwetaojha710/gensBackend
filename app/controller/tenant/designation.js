const Designation = require('../../models/designation');
const Tenant = require('../../models/tenant');
const Department = require('../../models/department');
const Helper = require('../../helper/helper');

exports.createDesignation = async (req, res) => {
    const { department, name, status } = req.body;
    const tenantId = req.users && req.users.tenantId;
    try {
        if (!tenantId || !department || !name) {
            return Helper.response(false, 'Tenant ID, Department ID and Name are required', [], res, 400);
        }

        const tenant = await Tenant.findOne({ where: { id: tenantId } });
        if (!tenant) {
            return Helper.response(false, 'Tenant not found', [], res, 404);
        }

        const departmentExists = await Department.findOne({ where: { id: department, tenantId } });
        if (!departmentExists) {
            return Helper.response(false, 'Department not found', [], res, 404);
        }

        const departmentName = departmentExists.name;
        
        const newDesignation = await Designation.create({
            tenantId,
            department,
            name,
            status: status || 'active',
            createdBy: req.users && req.users.id,
            updatedBy: req.users && req.users.id
        });

        return Helper.response(true, 'Designation created successfully', newDesignation, res, 201);
    } catch (error) {
        console.error('Error creating designation:', error);
        return Helper.response(false, 'Internal server error', [], res, 500);
    }
}

exports.getDesignation = async (req, res) => {
    const tenantId = req.users && req.users.tenantId;
    const { department } = req.body || {};

    try {
        if (!tenantId) {
            return Helper.response(false, 'Tenant ID is required', [], res, 400);
        }

        const tenant = await Tenant.findOne({ where: { id: tenantId } });
        if (!tenant) {
            return Helper.response(false, 'Tenant not found', [], res, 404);
        }

        let designations = await Helper.getDesig();

        if (!designations || !Array.isArray(designations)) {
            console.error("No designations returned:", designations);
            return Helper.response(false, 'No designations found', [], res, 404);
        }

        
        if (department) {
            const departmentExists = await Department.findOne({ where: { id: department, tenantId } });
            if (!departmentExists) {
                return Helper.response(false, 'Department not found', [], res, 404);
            }

            designations = designations.filter(d => d.department === department);
            if (designations.length === 0) {
                return Helper.response(false, 'No designations found for this department', [], res, 404);
            }
        }
        const departmentIds = designations.map(desig => desig.department);
        const departmentNames = await Department.findAll({
            where:{ id: departmentIds, tenantId },
            attributes: ['id', 'name']
        })
        const data = designations.map(desig => ({
            id:desig.id,
            name: desig.name,
            departmentName: departmentNames.find(dep => dep.id === desig.department)?.name || 'Unknown',
            department: desig.department,
            status: desig.status,
            createdAt: Helper.formatToIST(desig.createdat || desig.createdAt, 'YYYY-MM-DD HH:mm:ss')
        }));

        return Helper.response(true, 'Designations fetched successfully', data, res, 200);
    } catch (error) {
        console.error('Error in getDesignation:', error);
        return Helper.response(false, 'Internal server error', [], res, 500);
    }
};

exports.updateDesignation = async (req, res) => {
    const { id, department, name, status } = req.body;
    const tenantId = req.users && req.users.tenantId;
    try {
        if (!id || !tenantId) {
            return Helper.response(false, 'Designation ID and Tenant ID are required', [], res, 400);
        }

        const tenant = await Tenant.findOne({ where: { id: tenantId } });
        if (!tenant) {
            return Helper.response(false, 'Tenant not found', [], res, 404);
        }

        const designation = await Designation.findOne({ where: { id, tenantId } });
        if (!designation) {
            return Helper.response(false, 'Designation not found', [], res, 404);
        }

        if (department) {
            const departmentExists = await Department.findOne({ where: { id: department, tenantId } });
            if (!departmentExists) {
                return Helper.response(false, 'Department not found', [], res, 404);
            }
        }

        designation.name = name || designation.name;
        designation.department = department || designation.department;
        designation.status = status || designation.status;
        designation.updatedBy = req.users && req.users.id;

        await designation.save();

        return Helper.response(true, 'Designation updated successfully', designation, res, 200);
    } catch (error) {
        console.error('Error updating designation:', error);
        return Helper.response(false, 'Internal server error', [], res, 500);
    }
}

exports.deleteDesignation = async (req, res) => {
    const { id } = req.body;
    const tenantId = req.users && req.users.tenantId;
    try {
        if (!id || !tenantId) {
            return Helper.response(false, 'Designation ID and Tenant ID are required', [], res, 400);
        }

        const tenant = await Tenant.findOne({ where: { id: tenantId } });
        if (!tenant) {
            return Helper.response(false, 'Tenant not found', [], res, 404);
        }

        const designation = await Designation.findOne({ where: { id, tenantId } });
        if (!designation) {
            return Helper.response(false, 'Designation not found', [], res, 404);
        }

        await designation.destroy();

        return Helper.response(true, 'Designation deleted successfully', [], res, 200);
    } catch (error) {
        console.error('Error deleting designation:', error);
        return Helper.response(false, 'Internal server error', [], res, 500);
    }
}