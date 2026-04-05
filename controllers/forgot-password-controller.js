/*
Functions:
-Update the forgot_password of employees that sent a notification
-Delete of forgot password notifcations that were addressed
*/

const forgot_password = require('../models/forgot_password_model.js'); 
const employee = require('../models/employee_model.js'); 
const database = require('../models/database.js');
const { verifyPassword } = require('../utils/password');
const { logAuditEvent } = require('../utils/audit-log');

const forgot_password_controller = {
    get_security_question: async function(req, res){
        const { email } = req.body;
        if(!email){
            await logAuditEvent({
                email: 'GUEST',
                employeeType: 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Forgot password: missing email in security question lookup'
            });
            await logAuditEvent({
                email: 'GUEST',
                employeeType: 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Forgot password: missing email in security question lookup'
            });
            return res.status(400).json({success: false, message: "Email is required."});
        }
        const user = await employee.findOne({Email: email});
        if(!user || !user.Security_Question){
            await logAuditEvent({
                email: email,
                employeeType: 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Forgot password: email not found or no security question set'
            });
            return res.status(404).json({success: false, message: "Email not found or no security question configured."});
        }
        return res.json({success: true, securityQuestion: user.Security_Question});
    },

    post_add_forgot_password: async function (req, res){
        const {email, cTime, securityAnswer} = req.body;
        const user_exists = await employee.findOne({Email: email});
        if(user_exists){
            // Verify security answer
            if(!securityAnswer || !user_exists.Security_Answer_Hash){
                await logAuditEvent({
                    email: email,
                    employeeType: user_exists.Employee_Type || 'Guest',
                    action: 'VALIDATION_FAILED',
                    route: req.originalUrl,
                    details: 'Forgot password: missing security answer'
                });
                return res.json({success: false, message: "Security answer is required."});
            }

            const answerCheck = await verifyPassword(securityAnswer.trim().toLowerCase(), user_exists.Security_Answer_Hash);
            if(!answerCheck.isValid){
                await logAuditEvent({
                    email: email,
                    employeeType: user_exists.Employee_Type || 'Guest',
                    action: 'VALIDATION_FAILED',
                    route: req.originalUrl,
                    details: 'Forgot password: incorrect security answer'
                });
                return res.json({success: false, message: "Incorrect security answer."});
            }

            const forgot_password_exists = await database.findOne(forgot_password, {Email: email});
            if(!forgot_password_exists){
                const count = await forgot_password.countDocuments();
                try{
                    const new_forgot_password = new forgot_password({
                        Forgot_Password_Number: count+1,
                        Email: email,
                        Time: cTime,
                        Name: user_exists.First_Name + " " + user_exists.Last_Name
                    });
                    await new_forgot_password.save();
                    
                    await logAuditEvent({
                        email: email,
                        employeeType: user_exists.Employee_Type || 'Guest',
                        action: 'FORGOT_PASSWORD_REQUESTED',
                        route: req.originalUrl,
                        details: 'Forgot password request created successfully'
                    });
                    res.status(200).json({success: true, message: "Forgot Password Successful!"});
                }catch(error){
                    console.error("Error in post_add_forgot_password:", error);
                    res.status(500).json({success: false, message: "Forgot Password Controller Error!"});
                }
            }else{
                await logAuditEvent({
                    email: email,
                    employeeType: user_exists.Employee_Type || 'Guest',
                    action: 'VALIDATION_FAILED',
                    route: req.originalUrl,
                    details: 'Forgot password: duplicate forgot-password request already exists'
                });
                return res.json({success: false, message: "Forgot Password Already Exist."}); 
            }
        }else{
            await logAuditEvent({
                email: email || 'GUEST',
                employeeType: 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Forgot password: email does not exist'
            });
            return res.json({success: false, message: "Email Does Not Exist."});
        }
    },

    post_delete_forgot_password: async function (req, res){        
        const email = req.body.email;
        const user_exists = await forgot_password.findOne({Email: email});
        
        if(user_exists){
            const curr_forgot_password_number = user_exists.Forgot_Password_Number;
            try{
                await forgot_password.deleteOne({Email: email});

                await forgot_password.updateMany({Forgot_Password_Number: {$gt: curr_forgot_password_number}}, {$inc: {Forgot_Password_Number: -1}});
                res.status(200).json({success: true, message: "Forgot Password Record Deleted Successfully."});
            }catch(error){
                res.status(500).send("Internal Server Error!");
            }
        }else{
            await logAuditEvent({
                email: email || 'GUEST',
                employeeType: req.session?.Employee_Type || 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Forgot password delete failed: record not found'
            });
            return res.status(404).json({success: false, message: "Forgot Password Record Not Found."});
        }
    }
}

module.exports = forgot_password_controller;