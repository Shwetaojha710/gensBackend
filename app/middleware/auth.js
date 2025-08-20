const users = require("../models/users");
const Helper = require("../helper/helper");

const Admin = async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      const token = authHeader && authHeader.split(" ")[1];
 
      if (!token) {
        return Helper.response(false, "Token not provided", {}, res, 200);
      }
 
      const decoded = await Helper.verifyToken(token);
      if (!decoded) {
        return Helper.response(false, "Invalid token", {}, res, 200);
      }
 
      const user = await users.findOne({ where: { id: decoded.id } });
 
      if (!user) {
        return Helper.response(false, "User not found", {}, res, 200);
      }
 
      if (user.token !== token) {
        return Helper.response(
          "expired",
          "Token Expired due to another login, Login Again!",
          {},
          res,
          200
        );
      }
 
      const allowedRoles = ["admin", "hr", "superadmin", "employee"];
      if (!allowedRoles.includes(user.role)) {
        return Helper.response(false, "Unauthorized role", {}, res, 200);
      }
 
      req.users = {
        id: user.id,
        name: user.name,
        token: user.token,
        role: user.role,
        tenantId: user.tenantId 
      };
 
      next();
 
    } catch (err) {
      return Helper.response(false, err.message || "Something went wrong", {}, res, 500);
    }
  };

  module.exports = Admin;