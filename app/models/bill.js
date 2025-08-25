const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const bill = sequelize.define('bill', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    bill_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique:true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    employeeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "empPersonals",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    bill_date:{
        type:DataTypes.DATEONLY,
        allowNull:true
    },
  
    net_amount:{
        type:DataTypes.INTEGER,
        allowNull:true
    },
    full_days: {
        type: DataTypes.STRING,
        allowNull: false
    },
    absent_days: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hours_worked: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bill_desc:{
        type:DataTypes.TEXT,
        allowNull:true
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

// bill.sync({ alter: true }).then(() => {
//     console.log('bill model synced successfully');
// }).catch((error) => {
//     console.error('Error syncing bill model:', error);
// });

module.exports = bill;