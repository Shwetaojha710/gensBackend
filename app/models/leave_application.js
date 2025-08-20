const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const leave_application = sequelize.define('leave_application', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    employeeId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    leaveTypeId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    fromDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    toDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    duration_type: {
        type: DataTypes.ENUM('full', 'first_half', 'second_half'),
        allowNull: false,
        defaultValue: 'full'
    },
    days: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    approverId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    appliedOn: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true
    }
})

// leave_application.sync({ alter: true }).then(() => {
//     console.log('leave_application model synced successfully');
// }).catch((error) => {
//     console.error('Error syncing leave_application model:', error);
// });


module.exports = leave_application;