const sequelize = require("../connection/connection");
const { DataTypes } = require("sequelize");

const empPersonal = sequelize.define("empPersonal", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  alternateMobile: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  permanentAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currentAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM("Male", "Female", "Other"),
    allowNull: true,
  },
  martialStatus: {
    type: DataTypes.ENUM("Single", "Married", "Divorced", "Widowed"),
    allowNull: true,
  },
  adhaarNo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  panNo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  fatherName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  motherName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
    allowNull: true,
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active",
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  reportingPersonId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  empType: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "employmentTypes",
      key: "id",
    },
  }, createdBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  empCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shift_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  designationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  timestamps: true,
});

// empPersonal
//   .sync({ alter: true })
//   .then(() => {
//     console.log("empPersonal model synced successfully");
//   })
//   .catch((error) => {
//     console.error("Error syncing empPersonal model:", error);
//   });

module.exports = empPersonal;
