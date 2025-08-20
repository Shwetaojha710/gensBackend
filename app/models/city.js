const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection.js");

const City = sequelize.define("cities", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "states",
            key: "id"
        },
    },
}, {
    tableName: "cities",
    timestamps: false
});


// sequelize.sync({ alter: true }).then(() => {
//     console.log("City model synced successfully");
// }).catch((error) => {
//     console.error("Error syncing City model:", error);
// });

module.exports = City; 