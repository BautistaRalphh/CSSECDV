/*
Functions:
-Login the Employee
-Create session email and employee type depending on the employee the logged in
*/

const employee = require('../models/employee_model.js');
const { verifyPassword, hashPassword } = require('../utils/password');
const { logAuditEvent } = require('../utils/audit-log');

const login_controller = {
    post_login: async function(req, res){
        const {email, password} = req.body;

        try{
            const user_exists = await employee.findOne({Email: email});

            if(!user_exists){
                await logAuditEvent({
                    email: email || 'GUEST',
                    employeeType: 'Guest',
                    action: 'LOGIN_FAILED',
                    route: req.originalUrl,
                    details: 'Login failed: email not found'
                });

                return res.status(404).json({message: "Incorrect Credentials!"});
            }

            // Account lock check
            if(user_exists.Account_Locked){
                await logAuditEvent({
                    email,
                    employeeType: user_exists.Employee_Type,
                    action: 'LOGIN_FAILED',
                    route: req.originalUrl,
                    details: 'Login attempted on locked account'
                });
                return res.status(403).json({message: "Your account has been locked due to too many failed login attempts. Please contact your administrator."});
            }

            const passwordCheck = await verifyPassword(password, user_exists.Password);
            if(!passwordCheck.isValid){
                const newAttempts = (user_exists.Failed_Login_Attempts || 0) + 1;
                const shouldLock = newAttempts >= 5;
                await employee.updateOne({Email: email}, {$set: {
                    Failed_Login_Attempts: newAttempts,
                    Account_Locked: shouldLock,
                    Account_Locked_At: shouldLock ? new Date() : user_exists.Account_Locked_At,
                    Last_Failed_Login: new Date()
                }});

                await logAuditEvent({
                    email,
                    employeeType: user_exists.Employee_Type,
                    action: 'LOGIN_FAILED',
                    route: req.originalUrl,
                    details: `Invalid password. Attempt ${newAttempts}/5${shouldLock ? ' - Account locked' : ''}`
                });

                if(shouldLock){
                    return res.status(403).json({message: "Your account has been locked due to too many failed login attempts. Please contact your administrator."});
                }
                return res.status(401).json({message: "Incorrect Credentials!"});
            }

            // Capture previous login timestamps before updating
            const prevLastLogin = user_exists.Last_Login || null;
            const prevLastFailedLogin = user_exists.Last_Failed_Login || null;

            if(passwordCheck.needsUpgrade){
                const hashedPassword = await hashPassword(password);
                await employee.updateOne({ Email: email }, { $set: { Password: hashedPassword } });
            }

            // Reset failed attempts, record successful login
            await employee.updateOne({Email: email}, {$set: {
                Failed_Login_Attempts: 0,
                Account_Locked: false,
                Last_Login: new Date()
            }});

            req.session.Email = email;
            req.session.Employee_Type = user_exists.Employee_Type;

            await logAuditEvent({
                email,
                employeeType: user_exists.Employee_Type,
                action: 'LOGIN',
                route: req.originalUrl,
                details: 'Successful login'
            });

            const type = user_exists.Employee_Type;
            return res.status(200).json({
                success: true,
                type,
                message: "Login Successful!",
                lastLogin: prevLastLogin,
                lastFailedLogin: prevLastFailedLogin
            });

        }catch(error){
            console.error("Error in post_login:", error);
            res.status(500).json({success: false, message: "Login Controller Error!"});
        }

    }
}

module.exports = login_controller;
