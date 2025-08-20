const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const deduction = sequelize.define('deduction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    deductionName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deductionType: {
        type: DataTypes.ENUM('fixed', 'percentage'),
        allowNull: false,
    },
    deductionValue: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
     createdBy: {
        type: DataTypes.UUID,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    timestamps: true
})


// deduction.sync({alter:true}).then(() => {
//     console.log("City model synced successfully");
// }).catch((error) => {
//     console.error("Error syncing City model:", error);
// });


module.exports = deduction;