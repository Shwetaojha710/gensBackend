const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");

const documentType = sequelize.define("documentType", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true
    },
    status:{
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false
    }
}, { 
    timestamps: true,
})

// sequelize.sync({ alter: true }).then(() => {
//     console.log('DocumentType model synced successfully');
// }).catch((error) => {
//     console.error('Error syncing DocumentType model:', error);
// });

module.exports = documentType;