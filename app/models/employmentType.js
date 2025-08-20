const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const EmploymentType = sequelize.define('employmentType', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    name: {
        type: DataTypes.ENUM('full-time', 'part-time', ),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true
    }
})

// EmploymentType.sync({ alter: true }).then(() => {
//     console.log('EmploymentType model synced successfully');
// }).catch((error) => {
//     console.error('Error syncing EmploymentType model:', error);
// });

module.exports = EmploymentType;