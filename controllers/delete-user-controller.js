/*
Functions:
-Display the delete-user.hbs (Admin: Delete Employee Page)
-Populate the page with employee details corresponding to the chosen employee
-Delete the documents in the mongodb regarding the chosen employee
*/

const employee = require('../models/employee_model.js');
const forgot_password = require('../models/forgot_password_model.js');
const { logAuditEvent } = require('../utils/audit-log');
const database = require('../models/database.js');

const delete_user_controller = {
    get_delete_user_page: function(req, res){
        res.render("delete-user");
    },

    get_delete_user: async function(req, res){
        const requesterType = req.session.Employee_Type;
        // Managers can only see Role B accounts; Administrators see all accounts
        const query = requesterType === "Manager"
            ? {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"}]}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);
        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            
            return emailA.localeCompare(emailB);
        });
        try{
            
            res.render("delete-user", {emp_emails}); 
        }catch (error){
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_display_info: async function (req,res){
        const requesterType = req.session.Employee_Type;
        const query = requesterType === "Manager"
            ? {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"}]}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);
        const email = req.body.email;
        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            
            return emailA.localeCompare(emailB);
        });
        try {
            const emp_sum = await employee.findOne({ Email: email });
    
            res.render("delete-user", {emp_sum, emp_emails});
        } catch (error) {
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_delete_user: async function (req, res){
        const {email} = req.body;
        const user_exists = await employee.findOne({Email: email});

        // Managers (Role A) cannot delete Admin or Manager accounts
        if(user_exists && req.session.Employee_Type === "Manager" &&
            (user_exists.Employee_Type === "Admin" || user_exists.Employee_Type === "Manager")){
                await logAuditEvent({
                    email: req.session.Email,
                    employeeType: req.session.Employee_Type,
                    action: 'AUTHORIZATION_FAILED',
                    targetEmail: email,
                    route: req.originalUrl,
                    details: `Manager attempted to delete restricted account type: ${user_exists.Employee_Type}`
                });

                return res.status(403).json({message: "Insufficient privileges to delete this account."});
            }

        if(user_exists){
            const user_exists_forgot_password = await forgot_password.findOne({Email: email});
            if(user_exists_forgot_password){
                const curr_forgot_password_number = user_exists_forgot_password.Forgot_Password_Number;
                try {                
                    await forgot_password.deleteOne({Email: email});
                    await forgot_password.updateMany({Forgot_Password_Number: {$gt: curr_forgot_password_number}}, {$inc: {Forgot_Password_Number: -1}})
    
                    await employee.deleteOne(user_exists);
                    
                    res.json({success: true, message: "Deletion successful!"})
                } catch (error) {
                    console.error('Error updating data in MongoDB:', error);     
                    res.status(500).render('error', { message: 'Internal Server Error' }); 
                }
            }else{
                try {                
                    await employee.deleteOne(user_exists);   
                    res.json({success: true, message: "Deletion successful!"})
                } catch (error) {
                    console.error('Error updating data in MongoDB:', error);     
                    res.status(500).render('error', { message: 'Internal Server Error' }); 
                }
            }
        }
        else{
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'VALIDATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Delete failed: target user does not exist'
            });
            
            return res.status(400).json({message: "There are no Existing Users!"});
        }
    }
}

module.exports = delete_user_controller;
