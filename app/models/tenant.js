const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection");
const Tenant = sequelize.define('tenant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    companyCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    plan: {
        type: DataTypes.STRING,
        defaultValue: 'basic'
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null
    }
});

Tenant.associate = models => {
    Tenant.hasMany(models.User, { foreignKey: 'tenantId' });
};

// Tenant.sync({ alter: true }).then(() => {
//     console.log('User model synced successfully');
// }).catch((error) => {
//     console.error('Error syncing User model:', error);
// });


module.exports = Tenant;