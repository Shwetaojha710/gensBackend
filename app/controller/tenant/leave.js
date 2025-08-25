const Helper = require("../../helper/helper");
const leaveMaster = require("../../models/leaveMaster");
const leaveBalance = require("../../models/leaveBalance");
const leave_application = require("../../models/leave_application");
const moment = require("moment");
const empPersonal = require("../../models/empPersonal");
const leave_balance = require("../../models/leaveBalance");


exports.createLeave = async (req, res) => {
    const { leaveName, leaveCode, isPaid, allowedPerYear, carryForward, enCashable, maxCarryForward, genderRestriction, requiresApproval, applyBeforeDays, description } = req.body
    const tenantId = req.users && req.users.tenantId;

    try {
        const leave_master = new leaveMaster()

        const existingLeave = await leaveMaster.findOne({ where: { leaveName, leaveCode } })
        if (existingLeave) {
            return Helper.response(false, "Leave name or code already exists for this tenant.", [], res, 400);
        }

        leave_master.leaveName = leaveName
        leave_master.leaveCode = leaveCode
        leave_master.isPaid = isPaid
        leave_master.allowedPerYear = allowedPerYear
        leave_master.carryForward = carryForward
        leave_master.enCashable = enCashable
        leave_master.genderRestriction = genderRestriction
        leave_master.requiresApproval = requiresApproval
        leave_master.applyBeforeDays = applyBeforeDays
        leave_master.description = description
        leave_master.tenantId = tenantId
        leave_master.maxCarryForward = maxCarryForward

        if (await leave_master.save()) {
            return Helper.response(true, "Leave created successfully.", leave_master, res, 200);
        }
        return Helper.response(false, "Failed to create leave.", [], res, 400);
    } catch (error) {
        console.error("Error creating deduction:", error);
        return Helper.response(false, "Internal server error.", [], res, 500);
    }
}

exports.getLeaves = async (req, res) => {
    const tenantId = req.users && req.users.tenantId;

    try {
        const leaves = await leaveMaster.findAll()
        return Helper.response(true, "Leave fetched successfully.", leaves, res, 200);
    } catch (error) {
        console.error("Error creating deduction:", error);
        return Helper.response(false, "Internal server error.", [], res, 500);
    }
}


exports.updatedLeave = async (req, res) => {
    const { id, leaveName, leaveCode, isPaid, allowedPerYear, carryForward, enCashable, genderRestriction, maxCarryForward, requiresApproval, applyBeforeDays, description } = req.body
    const tenantId = req.users && req.users.tenantId;
    try {

        const existingLeave = await leaveMaster.findOne({ where: { id } })


        existingLeave.leaveName = leaveName
        existingLeave.leaveCode = leaveCode
        existingLeave.isPaid = isPaid
        existingLeave.allowedPerYear = allowedPerYear
        existingLeave.carryForward = carryForward
        existingLeave.enCashable = enCashable
        existingLeave.genderRestriction = genderRestriction
        existingLeave.requiresApproval = requiresApproval
        existingLeave.applyBeforeDays = applyBeforeDays
        existingLeave.description = description
        existingLeave.tenantId = tenantId
        existingLeave.maxCarryForward = maxCarryForward
        existingLeave.updatedBy = req.users && req.users.id


        if (await existingLeave.save()) {
            return Helper.response(true, "Leave updated successfully.", existingLeave, res, 200);
        }
        return Helper.response(false, "Failed to create leave.", [], res, 400);
    } catch (error) {
        console.error("Error creating leaves:", error);
        return Helper.response(false, "Internal server error.", [], res, 500);
    }
}

exports.destroy = async (req, res) => {
    try {
        const tenantId = req.users && req.users.tenantId
        const { id } = req.body

        const recordDestroy = await leaveMaster.destroy({ where: { id } })
        if (recordDestroy) {
            return Helper.response(true, "Leave deleted successfully.", recordDestroy, res, 200);
        }
        return Helper.response(false, "Failed to create leave.", [], res, 400);
    } catch (error) {
        console.error("Error creating leaves:", error);
        return Helper.response(false, "Internal server error.", [], res, 500);
    }
}


exports.assignLeave = async (req, res) => {
    const { employeeId, leaveTypeId, year, totalAssigned, carryForwarded = 0 } = req.body
    const tenantId = req.users && req.users.tenantId;

    if (!employeeId || !leaveTypeId || !year || !totalAssigned || !tenantId) {
        return Helper.response(false, "Required fields missing", [], res, 200);
    }

    try {
        const existing = await leaveBalance.findOne({
            where: { employeeId, leaveTypeId, year }
        });
        const usedLeaves = existing ? existing.usedLeaves : 0;
        const remainingLeaves = parseFloat(totalAssigned) + parseFloat(carryForwarded) - parseFloat(usedLeaves);
        if (existing) {
            await existing.update({
                totalAssigned,
                carryForwarded,
                remainingLeaves
            });
            return Helper.response(true, "Leave balance updated", existing, res, 200);
        }
        const assignLeave = new leaveBalance()
        assignLeave.employeeId = employeeId
        assignLeave.leaveTypeId = leaveTypeId
        assignLeave.year = year
        assignLeave.totalAssigned = totalAssigned
        assignLeave.carryForwarded = carryForwarded
        assignLeave.tenantId = tenantId
        assignLeave.remainingLeaves = remainingLeaves
        assignLeave.usedLeaves = usedLeaves
        assignLeave.createdBy = req.users && req.users.id

        if (await assignLeave.save()) {
            return Helper.response(true, "Leave balance assigned", assignLeave, res, 200);
        }
        return Helper.response(false, "Unable to assign leave!", [], res, 200);
    } catch (error) {
        console.error("Assign Leave Error:", error);
        return Helper.response(false, "Server error", error, res, 500);
    }
}

exports.getLeaveTypes = async (req, res) => {
    const tenantId = req.users && req.users.tenantId;

    try {
        const leaveTypes = await leaveMaster.findAll({
            where: { tenantId }
        });
        const data = []
        leaveTypes.map((r) => {
            const value = {
                value: r.id,
                label: r.leaveName,
                allowedPerYear: r.allowedPerYear,
            }
            data.push(value)
        })
        return Helper.response(true, "Leave types fetched successfully.", data, res, 200);
    } catch (error) {
        console.error("Error fetching leave types:", error);
        return Helper.response(false, "Internal server error.", [], res, 500);
    }
}

exports.getLeaveByEmployee = async (req, res) => {
    const { employeeId, year } = req.body
    const tenantId = req.users && req.users.tenantId;
    try {
        const leaveBalanceData = await leaveBalance.findAll({
            where: { employeeId, year, tenantId }, raw: true
        });

        const leaveBalanceRecord = await Promise.all(leaveBalanceData.map(async (r) => {
            const leaveType = await leaveMaster.findByPk(r.leaveTypeId)

            return {
                ...r,
                leaveTypeId: leaveType.leaveName,
                createdAt: Helper.dateFormat(r.createdAt)
            }
        }))
        if (leaveBalanceRecord.length > 0) {
            return Helper.response(true, "Leave balance fetched successfully.", leaveBalanceRecord, res, 200);
        } else {
            return Helper.response(false, "No leave balance found for this employee.", [], res, 404);
        }
    } catch (error) {
        console.error("Error fetching leave balance:", error);
        return Helper.response(false, error?.message, [], res, 500);
    }

}


exports.applyForLeave = async (req, res) => {
    const { employeeId, leaveTypeId, fromDate, toDate, reason, duration_type = 'full' } = req.body
    const tenantId = req.users && req.users.tenantId;
    const createdBy = req.users && req.users.id;

    if (!employeeId || !leaveTypeId || !fromDate || !toDate || !tenantId) {
        return Helper.response(false, "Required fields missing", [], res, 200);
    }


    try {
        let days = moment(toDate).diff(moment(fromDate), 'days') + 1;
        if (duration_type === 'first_half' || duration_type === 'second_half') {
            days = 0.5;
        }
        const leaveApplication = new leave_application()
        leaveApplication.employeeId = employeeId
        leaveApplication.leaveTypeId = leaveTypeId
        leaveApplication.fromDate = fromDate
        leaveApplication.duration_type = duration_type
        leaveApplication.toDate = toDate
        leaveApplication.days = days
        leaveApplication.reason = reason
        leaveApplication.tenantId = tenantId
        leaveApplication.createdBy = createdBy

        if (await leaveApplication.save()) {
            return Helper.response(true, "Leave application submitted successfully.", leaveApplication, res, 200);
        }
        return Helper.response(false, "Failed to apply for leave.", [], res, 400);
    } catch (error) {
        console.error("Error applying for leave:", error);
        return Helper.response(false, error?.message, [], res, 500);
    }
}

exports.getAppliedLeaves = async (req, res) => {
    const tenantId = req.users && req.users.tenantId;
    const employeeId = req.users && req.users.id;

    try {
        const appliedLeaves = await leave_application.findAll({
            order: [['appliedOn', 'DESC']]
        });

        const all = await Promise.all(appliedLeaves.map(async (r) => {
            const employee = await empPersonal.findByPk(r.employeeId, { attributes: ['firstName', 'lastName', 'email'] });
            const leaveType = await leaveMaster.findByPk(r.leaveTypeId)
            return {
                leaveTypeId:r?.leaveTypeId,
                id:r?.id,
                employeeId:r?.employeeId,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeEmail: employee.email,
                appliedOn: r.appliedOn,
                reason: r.reason,
                duration_type_name: r.duration_type === 'full' ? 'Full Day' : r.duration_type === 'first_half' ? 'First Half' : 'Second Half',
                duration_type:r?.duration_type,
                fromDate: r.fromDate,
                toDate: r.toDate,
                days: r.days,
                status: r.status,
                leaveName: leaveType.leaveName,
                leaveCode: leaveType.leaveCode,
                createdAt: Helper.dateFormat(r.createdAt),
            }
        }))
        if (all.length > 0) {
            return Helper.response(true, "Applied leaves fetched successfully.", all, res, 200);
        } else {
            return Helper.response(false, "No applied leaves found for this employee.", [], res, 404);
        }
    } catch (error) {
        console.error("Error fetching applied leaves:", error);
        return Helper.response(false, "Internal server error.", [], res, 500);
    }
}



exports.updatedApplyLeaveStatus = async (req, res) => {
    const { id, employeeId, leaveTypeId, status,reason ,days,appliedOn} = req.body
    const tenantId = req.users && req.users.tenantId;
    try {
         const year = new Date(appliedOn).getFullYear();
        const leaveBalance=await leave_balance.findOne({
            where:{
                tenantId,
                leaveTypeId:leaveTypeId,
                employeeId,
                year
            }
        })
        if(!leaveBalance){
            return Helper.response(false, "Assigned Leave First", [], res, 400);
        }
        const existingLeave = await leave_application.findOne({ where: { id } })


        existingLeave.status = status
        existingLeave.reason = reason
        existingLeave.updatedBy = req.users && req.users.id
        existingLeave.approverId=req.users&&req.users.id
       
         let remainingLeaves
        if (await existingLeave.save()) {
            if(leaveBalance.remainingLeaves<Number(days)){
               remainingLeaves=0
            }else{
                remainingLeaves=leaveBalance.remainingLeaves-Number(days)
            }
        
            const updateleavebalance= await leave_balance.update({
                   usedLeaves:days,
                   remainingLeaves,
                   updatedBy:req.users?.id
            },{
           where:{
               tenantId,
                leaveTypeId:leaveTypeId,
                employeeId,
                year
           }
            })
            return Helper.response(true, "Leave updated successfully.", existingLeave, res, 200);
        }
        return Helper.response(false, "Failed to create leave.", [], res, 400);
    } catch (error) {
        console.error("Error creating leaves:", error);
        return Helper.response(false, error?.message, [], res, 500);
    }
}
