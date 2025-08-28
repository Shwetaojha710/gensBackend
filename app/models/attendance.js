const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const attendance = sequelize.define("attendance", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    employeeId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    check_in_time: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    check_out_time: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    is_present: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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

// attendance.sync({alter:true})
//     .then(() => {
//         console.log("attendance table created or updated successfully.");
//     })
//     .catch((error) => {
//         console.error("Error creating or updating Shift table:", error);
//     });
module.exports = attendance;
