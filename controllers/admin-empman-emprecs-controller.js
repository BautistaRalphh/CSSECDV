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
const { hashPassword, verifyPassword, validatePassword } = require('../utils/password');
const { validateEmployeeInput } = require('../utils/validation');

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
            res.render("admin-empman-emprecs", { emp_emails, emp_sum: target, isAdmin, managers, canEdit, canAssignManager: canAssignManager ? "yes" : false, isLocked: target ? !!target.Account_Locked : false });
        } catch (error) {
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_update_employee_info: async function(req, res){
        const {email, firstName, lastName, address, contactNumber, currentPassword, password, employee_type} = req.body;
        const requesterType = req.session.Employee_Type;

        const target = await employee.findOne({Email: email});
        if(!target){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'VALIDATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Employee update failed: employee not found'
            });

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


        if(!firstName || !lastName || !address || !contactNumber){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'VALIDATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Employee update failed: missing required fields'
            });

            return res.status(400).json({message: "Missing required fields."});
        }

        // Server-side input validation (range + length)
        const inputErrors = validateEmployeeInput({firstName, lastName, address, contactNumber}, false);
        if(inputErrors.length > 0){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'VALIDATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: `Employee update failed: ${inputErrors.join(', ')}`
            });
            return res.status(400).json({message: inputErrors.join(' ')});
        }

        const updateFields = {
            First_Name: firstName,
            Last_Name: lastName,
            Address: address,
            Contact_Number: contactNumber
        };

        if(password){
            // 0. Re-authenticate: require current password before allowing password change
            if(!currentPassword){
                await logAuditEvent({
                    email: req.session.Email,
                    employeeType: req.session.Employee_Type,
                    action: 'VALIDATION_FAILED',
                    targetEmail: email,
                    route: req.originalUrl,
                    details: 'Password change failed: current password not provided for re-authentication'
                });
                return res.status(400).json({message: "Current password is required to change the password."});
            }

            // Verify the requester's own password for re-authentication
            const requester = await employee.findOne({Email: req.session.Email});
            const reAuthCheck = await verifyPassword(currentPassword, requester.Password);
            if(!reAuthCheck.isValid){
                await logAuditEvent({
                    email: req.session.Email,
                    employeeType: req.session.Employee_Type,
                    action: 'VALIDATION_FAILED',
                    targetEmail: email,
                    route: req.originalUrl,
                    details: 'Password change failed: re-authentication failed (incorrect current password)'
                });
                return res.status(401).json({message: "Current password is incorrect. Re-authentication failed."});
            }

            // 1. Complexity & length policy
            const pwErrors = validatePassword(password);
            if(pwErrors.length > 0){
                    await logAuditEvent({
                        email: req.session.Email,
                        employeeType: req.session.Employee_Type,
                        action: 'VALIDATION_FAILED',
                        targetEmail: email,
                        route: req.originalUrl,
                        details: `Employee update failed: weak password (${pwErrors.join(', ')})`
                    });
                    
                return res.status(400).json({message: `Password must contain: ${pwErrors.join(', ')}.`});
            }

            // 2. Password age: must be at least 1 day old before it can be changed
            if(target.Password_Changed_At){
                const ageMs = Date.now() - new Date(target.Password_Changed_At).getTime();
                const oneDayMs = 24 * 60 * 60 * 1000;
                if(ageMs < oneDayMs){
                        await logAuditEvent({
                            email: req.session.Email,
                            employeeType: req.session.Employee_Type,
                            action: 'VALIDATION_FAILED',
                            targetEmail: email,
                            route: req.originalUrl,
                            details: 'Employee update failed: password less than one day old'
                        });

                    return res.status(400).json({message: "Password cannot be changed yet. Passwords must be at least one day old before they can be changed."});
                }
            }

            // 3. Password reuse check (current + last 5)
            const historyToCheck = [target.Password, ...(target.Password_History || [])];
            for(const oldHash of historyToCheck){
                if(!oldHash) continue;
                const match = await verifyPassword(password, oldHash);
                if(match.isValid){
                        await logAuditEvent({
                            email: req.session.Email,
                            employeeType: req.session.Employee_Type,
                            action: 'VALIDATION_FAILED',
                            targetEmail: email,
                            route: req.originalUrl,
                            details: 'Employee update failed: password reuse detected'
                        });

                    return res.status(400).json({message: "New password cannot be the same as a previously used password."});
                }
            }

            // Rotate history (keep last 5) and hash new password
            const newHistory = [target.Password, ...(target.Password_History || [])].slice(0, 5);
            updateFields.Password = await hashPassword(password);
            updateFields.Password_History = newHistory;
            updateFields.Password_Changed_At = new Date();
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
                await logAuditEvent({
                    email: req.session.Email,
                    employeeType: req.session.Employee_Type,
                    action: 'VALIDATION_FAILED',
                    targetEmail: employee_email,
                    route: req.originalUrl,
                    details: 'Manager assignment failed: employee not found'
                });

            return res.status(404).json({message: "Employee not found."});
        }

        if(manager_email){
            const mgr = await employee.findOne({Email: manager_email, Employee_Type: "Manager"});
            if(!mgr){
                    await logAuditEvent({
                        email: req.session.Email,
                        employeeType: req.session.Employee_Type,
                        action: 'VALIDATION_FAILED',
                        targetEmail: employee_email,
                        route: req.originalUrl,
                        details: `Manager assignment failed: selected manager does not exist (${manager_email})`
                    });

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
    },

    post_unlock_account: async function(req, res){
        const { email } = req.body;

        const target = await employee.findOne({Email: email});
        if(!target){
                await logAuditEvent({
                    email: req.session.Email,
                    employeeType: req.session.Employee_Type,
                    action: 'VALIDATION_FAILED',
                    targetEmail: email,
                    route: req.originalUrl,
                    details: 'Account unlock failed: employee not found'
                });
            return res.status(404).json({message: "Employee not found."});
        }

        // Only admins can unlock; admins cannot unlock other admin accounts
        if(target.Employee_Type === "Admin"){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'AUTHORIZATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Attempted to unlock an Admin account'
            });
            return res.status(403).json({message: "Administrator accounts cannot be unlocked this way."});
        }

        try{
            await database.updateOne(employee, {Email: email}, {$set: {
                Account_Locked: false,
                Failed_Login_Attempts: 0,
                Account_Locked_At: null
            }});

            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'ACCOUNT_UNLOCKED',
                targetEmail: email,
                route: req.originalUrl,
                details: 'Admin manually unlocked account'
            });

            res.json({success: true, message: "Account unlocked successfully."});
        }catch(error){
            console.error("Error unlocking account:", error);
            res.status(500).json({success: false, message: "Unlock failed."});
        }
    }
}

module.exports = admin_empman_emprecs_controller;