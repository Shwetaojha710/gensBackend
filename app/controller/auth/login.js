const sequelize = require("../../connection/connection");
const User = require("../../models/users");
const Helper = require("../../helper/helper");
const CryptoJS = require("crypto-js");
const Tenant = require("../../models/tenant");
const jwt = require("jsonwebtoken");
require("dotenv").config();


exports.login = async (req, res) => {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
        return Helper.response(false, 'Email, password, and tenant ID are required.', [], res, 200);
    }

    try {
        const tenant = await Tenant.findOne({
            where: {
                companyCode: tenantId,
                status: 'active'
            }
        });

        if (!tenant) {
            return Helper.response(false, 'Tenant not found!', [], res, 200);
        }

        const user = await User.findOne({
            where: {
                email,
                tenantId: tenant.id,
                status: 'active'
            }
        });

        if (!user) {
            return Helper.response(false, 'Invalid email or tenant.', [], res, 200);
        }

        const hashedInput = CryptoJS.SHA256(password).toString();
        if (user.password !== hashedInput) {
            return Helper.response(false, 'Invalid password.', [], res, 200);
        }

        const token = jwt.sign(
            { id: user.id, tenantId: user.tenantId, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: '8h' }
        );

        // ✅ Store the token in the user record
        await user.update({ token });

        const baseUrl = process.env.BASE_URL;
        return Helper.response(true, 'You have Logged In Successfully!', {baseUrl, token, user }, res, 200);

    } catch (err) {
        console.error('Login error:', err);
        return Helper.response(false, 'Internal server error.', [], res, 200);
    }
};

exports.logout = async (req, res) => {
    const userId = req.users && req.users.id;
    if (!userId) {
        return Helper.response(false, 'User ID is required.', [], res, 400);
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return Helper.response(false, 'User not found.', [], res, 404);
        }

        // Clear the token from the user record
        await user.update({ token: null });

        return Helper.response(true, 'You have logged out successfully!', [], res, 200);
    } catch (err) {
        console.error('Logout error:', err);
        return Helper.response(false, 'Internal server error.', [], res, 500);
    }
}
