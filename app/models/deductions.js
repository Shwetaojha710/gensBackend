const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const deduction = sequelize.define(
  "deduction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deductionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deductionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    deductionType: {
      type: DataTypes.ENUM("fixed", "percentage"),
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
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "empPersonals",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    typeValue: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// deduction.sync({alter:true}).then(() => {
//     console.log("City model synced successfully");
// }).catch((error) => {
//     console.error("Error syncing City model:", error);
// });

module.exports = deduction;
