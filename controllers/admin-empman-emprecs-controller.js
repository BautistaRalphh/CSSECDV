/*
Functions:
-Display the admin-empman-emprecs.hbs (Admin: Employee Management - Employee Information Page)
-Populate the page with the corresponding employee details
-Edit employee info (admin: any; manager: only their assigned employees)
-Assign employees to managers (admin only)
*/

const employee = require('../models/employee_model.js');
const database = require('../models/database.js');
const { logAuditEvent } = require('../utils/audit-log');
const { hashPassword } = require('../utils/password');

const admin_empman_emprecs_controller = {
    get_emprecs: async function(req, res){
        const requesterType = req.session.Employee_Type;
        const isAdmin = requesterType === "Admin";

        const query = requesterType === "Manager"
            ? {Employee_Type: {$in: ["Employee", "Work From Home"]}, Manager_Email: req.session.Email}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);

        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            return emailA.localeCompare(emailB);
        });

        try{
            res.render("admin-empman-emprecs", {emp_emails, isAdmin});
        }catch (error){
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_specific_emprecs: async function(req, res){
        const requesterType = req.session.Employee_Type;
        const isAdmin = requesterType === "Admin";

        const query = requesterType === "Manager"
            ? {Employee_Type: {$in: ["Employee", "Work From Home"]}, Manager_Email: req.session.Email}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);
        const email = req.body.email;

        const target = await employee.findOne({Email: email});

        // Managers can only view employees assigned to them
        if(requesterType === "Manager" && target && target.Manager_Email !== req.session.Email){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'AUTHORIZATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Manager attempted to view employee not assigned to them'
            });

            return res.status(403).send("You can only view records of employees assigned to you.");
        }

        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            return emailA.localeCompare(emailB);
        });

        const isAdminTarget = target && target.Employee_Type === "Admin";
        const canEdit = (isAdmin && !isAdminTarget) || (!isAdmin && target && target.Manager_Email === req.session.Email);

        const isRoleB = target && (target.Employee_Type === "Employee" || target.Employee_Type === "Work From Home");
        const canAssignManager = (isAdmin && isRoleB) ? true : false;

        let managers = [];
        if(isAdmin && isRoleB){
            managers = await database.findMany(employee, {Employee_Type: "Manager"});
        }

        try {
            res.render("admin-empman-emprecs", { emp_emails, emp_sum: target, isAdmin, managers, canEdit, canAssignManager: canAssignManager ? "yes" : false });
        } catch (error) {
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_update_employee_info: async function(req, res){
        const {email, firstName, lastName, address, contactNumber, password, employee_type} = req.body;
        const requesterType = req.session.Employee_Type;

        const target = await employee.findOne({Email: email});
        if(!target){
            return res.status(404).json({message: "Employee not found."});
        }

        if(requesterType === "Manager" && target.Manager_Email !== req.session.Email){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'AUTHORIZATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Manager attempted to edit employee not assigned to them'
            });

            return res.status(403).json({message: "You can only edit employees assigned to you."});
        }

        if(requesterType === "Admin" && target.Employee_Type === "Admin"){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'AUTHORIZATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Admin attempted to edit another admin account'
            });

            return res.status(403).json({message: "Administrators cannot edit other administrator accounts."});
        }

        if(requesterType === "Manager" &&
            (target.Employee_Type === "Admin" || target.Employee_Type === "Manager")){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'AUTHORIZATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Manager attempted to edit Admin/Manager account'
            });

            return res.status(403).json({message: "Insufficient privileges to edit this account."});
        }

        const updateFields = {
            First_Name: firstName,
            Last_Name: lastName,
            Address: address,
            Contact_Number: contactNumber
        };

        if(password){
            updateFields.Password = await hashPassword(password);
        }

        if(requesterType === "Admin" && employee_type){
            updateFields.Employee_Type = employee_type;
        }

        try{
            await database.updateOne(employee, {Email: email}, {$set: updateFields});
            
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'EMPLOYEE_EDIT',
                targetEmail: email,
                route: req.originalUrl,
                details: `Updated employee info fields: ${Object.keys(updateFields).join(', ')}`
            });

            res.json({success: true, message: "Employee info updated successfully!"});
        }catch(error){
            console.error("Error updating employee info:", error);
            res.status(500).json({success: false, message: "Update failed."});
        }
    },

    post_assign_manager: async function(req, res){
        const {employee_email, manager_email} = req.body;

        const target = await employee.findOne({Email: employee_email});
        if(!target){
            return res.status(404).json({message: "Employee not found."});
        }

        if(manager_email){
            const mgr = await employee.findOne({Email: manager_email, Employee_Type: "Manager"});
            if(!mgr){
                return res.status(400).json({message: "Selected manager does not exist."});
            }
        }

        try{
            await database.updateOne(employee, {Email: employee_email}, {$set: {Manager_Email: manager_email || null}});

            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'MANAGER_ASSIGNED',
                targetEmail: employee_email,
                route: req.originalUrl,
                details: manager_email
                    ? `Assigned manager ${manager_email} to employee`
                    : 'Removed assigned manager from employee'
            });

            res.json({success: true, message: "Manager assigned successfully!"});
        }catch(error){
            console.error("Error assigning manager:", error);
            res.status(500).json({success: false, message: "Assignment failed."});
        }
    }
}

module.exports = admin_empman_emprecs_controller;

/*
Functions:
-Display the admin-empman-emprecs.hbs (Admin: Employee Management - Employee Information Page)
-Populate the page with the corresponding employee details
-Edit employee info (admin: any; manager: only their assigned employees)
-Assign employees to managers (admin only)
*/

const employee = require('../models/employee_model.js');
const database = require('../models/database.js');

const admin_empman_emprecs_controller = {
    get_emprecs: async function(req, res){
        const requesterType = req.session.Employee_Type;
        const isAdmin = requesterType === "Admin";

        const query = requesterType === "Manager"
            ? {Employee_Type: {$in: ["Employee", "Work From Home"]}, Manager_Email: req.session.Email}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);

        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            return emailA.localeCompare(emailB);
        });

        try{
            res.render("admin-empman-emprecs", {emp_emails, isAdmin});
        }catch (error){
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_specific_emprecs: async function(req, res){
        const requesterType = req.session.Employee_Type;
        const isAdmin = requesterType === "Admin";

        const query = requesterType === "Manager"
            ? {Employee_Type: {$in: ["Employee", "Work From Home"]}, Manager_Email: req.session.Email}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);
        const email = req.body.email;

        const target = await employee.findOne({Email: email});

        // Managers can only view employees assigned to them
        if(requesterType === "Manager" && target && target.Manager_Email !== req.session.Email){
            return res.status(403).send("You can only view records of employees assigned to you.");
        }

        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            return emailA.localeCompare(emailB);
        });

        const isAdminTarget = target && target.Employee_Type === "Admin";
        const canEdit = (isAdmin && !isAdminTarget) || (!isAdmin && target && target.Manager_Email === req.session.Email);

        const isRoleB = target && (target.Employee_Type === "Employee" || target.Employee_Type === "Work From Home");
        const canAssignManager = (isAdmin && isRoleB) ? true : false;

        let managers = [];
        if(isAdmin && isRoleB){
            managers = await database.findMany(employee, {Employee_Type: "Manager"});
        }

        try {
            res.render("admin-empman-emprecs", { emp_emails, emp_sum: target, isAdmin, managers, canEdit, canAssignManager: canAssignManager ? "yes" : false });
        } catch (error) {
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_update_employee_info: async function(req, res){
        const {email, firstName, lastName, address, contactNumber, password, employee_type} = req.body;
        const requesterType = req.session.Employee_Type;

        const target = await employee.findOne({Email: email});
        if(!target){
            return res.status(404).json({message: "Employee not found."});
        }

        if(requesterType === "Manager" && target.Manager_Email !== req.session.Email){
            return res.status(403).json({message: "You can only edit employees assigned to you."});
        }

        if(requesterType === "Admin" && target.Employee_Type === "Admin"){
            return res.status(403).json({message: "Administrators cannot edit other administrator accounts."});
        }

        if(requesterType === "Manager" &&
           (target.Employee_Type === "Admin" || target.Employee_Type === "Manager")){
            return res.status(403).json({message: "Insufficient privileges to edit this account."});
        }

        const updateFields = {
            First_Name: firstName,
            Last_Name: lastName,
            Address: address,
            Contact_Number: contactNumber
        };

        if(password){ updateFields.Password = password; }

        if(requesterType === "Admin" && employee_type){
            updateFields.Employee_Type = employee_type;
        }

        try{
            await database.updateOne(employee, {Email: email}, {$set: updateFields});
            res.json({success: true, message: "Employee info updated successfully!"});
        }catch(error){
            console.error("Error updating employee info:", error);
            res.status(500).json({success: false, message: "Update failed."});
        }
    },

    post_assign_manager: async function(req, res){
        const {employee_email, manager_email} = req.body;

        const target = await employee.findOne({Email: employee_email});
        if(!target){
            return res.status(404).json({message: "Employee not found."});
        }

        if(manager_email){
            const mgr = await employee.findOne({Email: manager_email, Employee_Type: "Manager"});
            if(!mgr){
                return res.status(400).json({message: "Selected manager does not exist."});
            }
        }

        try{
            await database.updateOne(employee, {Email: employee_email}, {$set: {Manager_Email: manager_email || null}});
            res.json({success: true, message: "Manager assigned successfully!"});
        }catch(error){
            console.error("Error assigning manager:", error);
            res.status(500).json({success: false, message: "Assignment failed."});
        }
    }
}

module.exports = admin_empman_emprecs_controller;