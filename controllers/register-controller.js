/*
Functions:
-Display the register.hbs (Admin: Add Employee Page)
-Create new employee and weekly payroll
*/

const employee = require('../models/employee_model.js');
const payroll = require('../models/payroll_model.js');
const { logAuditEvent } = require('../utils/audit-log');
const { hashPassword, validatePassword } = require('../utils/password');
const { validateEmployeeInput } = require('../utils/validation');

const register_controller = {
    get_register: function(req, res){
        const isAdmin = req.session?.Employee_Type === "Admin";
        res.render('register', { isAdmin });
    }, 

    post_register: async function(req, res){
        const {firstName, lastName, address, contactNumber, email, password, employee_type, securityQuestion, securityAnswer} = req.body;

        if(!firstName || !lastName || !address || !contactNumber || !email || !employee_type || !securityQuestion || !securityAnswer){
            await logAuditEvent({
                email: email || 'GUEST',
                employeeType: req.session?.Employee_Type || 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Registration failed: missing required fields'
            });

            return res.status(400).json({message: "Missing required fields!"});
        }

        // Server-side input validation (range + length)
        const inputErrors = validateEmployeeInput({firstName, lastName, address, contactNumber, email, password});
        if(inputErrors.length > 0){
            await logAuditEvent({
                email: email || 'GUEST',
                employeeType: req.session?.Employee_Type || 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: `Registration failed: ${inputErrors.join(', ')}`
            });
            return res.status(400).json({message: inputErrors.join(' ')});
        }

        const requesterType = req.session?.Employee_Type;
        if(requesterType === "Manager" && (employee_type === "Admin" || employee_type === "Manager")){
            await logAuditEvent({
                email: req.session.Email,
                employeeType: req.session.Employee_Type,
                action: 'AUTHORIZATION_FAILED',
                targetEmail: email,
                route: req.originalUrl,
                details: `Manager attempted to create restricted account type: ${employee_type}`
            });

            return res.status(403).json({message: "Insufficient privileges to create this account type."});
        }

        const user_exists = await employee.findOne({Email: email});
        if(user_exists){
            await logAuditEvent({
                email: email || 'GUEST',
                employeeType: req.session?.Employee_Type || 'Guest',
                action: 'VALIDATION_FAILED',
                route: req.originalUrl,
                details: 'Registration failed: email already exists'
            });

            return res.status(400).json({message: "Email Already Exists!"});
        }else if(!password){
                await logAuditEvent({
                    email: email || 'GUEST',
                    employeeType: req.session?.Employee_Type || 'Guest',
                    action: 'VALIDATION_FAILED',
                    route: req.originalUrl,
                    details: 'Registration failed: missing password'
                });

            return res.status(400).json({message: "Missing Password!"});
        }else{
            const pwErrors = validatePassword(password);
            if(pwErrors.length > 0){
                    await logAuditEvent({
                        email: email || 'GUEST',
                        employeeType: req.session?.Employee_Type || 'Guest',
                        action: 'VALIDATION_FAILED',
                        route: req.originalUrl,
                        details: `Registration failed: weak password (${pwErrors.join(', ')})`
                    });

                return res.status(400).json({message: `Password must contain: ${pwErrors.join(', ')}.`});
            }
            try{
                const hashedPassword = await hashPassword(password);
                const hashedSecurityAnswer = await hashPassword(securityAnswer.trim().toLowerCase());
                const new_employee = new employee({
                    First_Name: firstName,
                    Last_Name: lastName,
                    Contact_Number: contactNumber,
                    Email: email,
                    Password: hashedPassword,
                    Address: address,
                    Employee_Type: employee_type,
                    IsTimedIn: false,
                    Password_Changed_At: new Date(),
                    Security_Question: securityQuestion,
                    Security_Answer_Hash: hashedSecurityAnswer
                });
                await new_employee.save();
                if(employee_type === "Employee" || employee_type === "Work From Home"){
                    //changes: new payroll 
                    // const initial_date = new Date();
                    const new_payroll = new payroll({
                        Email: email,
                        Week: 0,
                        Time_In_Weekday_Index: 0,
                        Mon_Hours: 0,
                        Mon_Minutes: 0,
                        Mon_Date: 0,
                        Mon_Time_In: 0,
                        Mon_Time_Out: 0,
                        Mon_Total_Pay: 0,
                        Mon_OT_Hours: 0,
                        Mon_OT_Compensation: 0,
                        Mon_Late_Hours: 0,
                        Mon_Late_Deduction: 0,
                        Tue_Hours: 0,
                        Tue_Minutes: 0,
                        Tue_Date: 0,
                        Tue_Time_In: 0,
                        Tue_Time_Out: 0,
                        Tue_Total_Pay: 0,
                        Tue_OT_Hours: 0,
                        Tue_OT_Compensation: 0,
                        Tue_Late_Hours: 0,
                        Tue_Late_Deduction: 0,
                        Wed_Hours: 0,
                        Wed_Minutes: 0,
                        Wed_Date: 0,
                        Wed_Time_In: 0,
                        Wed_Time_Out: 0,
                        Wed_Total_Pay: 0,
                        Wed_OT_Hours: 0,
                        Wed_OT_Compensation: 0,
                        Wed_Late_Hours: 0,
                        Wed_Late_Deduction: 0,
                        Thu_Hours: 0,
                        Thu_Minutes: 0,
                        Thu_Date: 0,
                        Thu_Time_In: 0,
                        Thu_Time_Out: 0,
                        Thu_Total_Pay: 0,
                        Thu_OT_Hours: 0,
                        Thu_OT_Compensation: 0,
                        Thu_Late_Hours: 0,
                        Thu_Late_Deduction: 0,
                        Fri_Hours: 0,
                        Fri_Minutes: 0,
                        Fri_Date: 0,
                        Fri_Time_In: 0,
                        Fri_Time_Out: 0,
                        Fri_Total_Pay: 0,
                        Fri_OT_Hours: 0,
                        Fri_OT_Compensation: 0,
                        Fri_Late_Hours: 0,
                        Fri_Late_Deduction: 0,
                        Sat_Hours: 0, 
                        Sat_Minutes: 0,
                        Sat_Date: 0,
                        Sat_Time_In: 0,
                        Sat_Time_Out: 0,
                        Sat_Total_Pay: 0,
                        Sat_OT_Hours: 0,
                        Sat_OT_Compensation: 0,
                        Sat_Late_Hours: 0,
                        Sat_Late_Deduction: 0,
                        Sun_Hours: 0,
                        Sun_Minutes: 0,
                        Sun_Date: 0,
                        Sun_Time_In: 0,
                        Sun_Time_Out: 0,
                        Sun_Total_Pay: 0,
                        Sun_OT_Hours: 0,
                        Sun_OT_Compensation: 0,
                        Sun_Late_Hours: 0,
                        Sun_Late_Deduction: 0,
                        Weekly_Total_Advance: 0,
                        Weekly_Total_Additional: 0,
                        Weekly_Total_Deduction: 0,
                        Weekly_Total_Pay: 0,
                        Weekly_Hourly_Rate: 10,
                        Deduction_PAGIBIG_Contribution: 0,
                        Deduction_Philhealth: 0,
                        Deduction_SSS: 0
                    });
                    await new_payroll.save();

                    const new_payroll_1 = new payroll({
                        Email: email,
                        Week: 1,
                        Time_In_Weekday_Index: 0,
                        Mon_Hours: 0,
                        Mon_Minutes: 0,
                        Mon_Date: 0,
                        Mon_Time_In: 0,
                        Mon_Time_Out: 0,
                        Mon_Total_Pay: 0,
                        Mon_OT_Hours: 0,
                        Mon_OT_Compensation: 0,
                        Mon_Late_Hours: 0,
                        Mon_Late_Deduction: 0,
                        Tue_Hours: 0,
                        Tue_Minutes: 0,
                        Tue_Date: 0,
                        Tue_Time_In: 0,
                        Tue_Time_Out: 0,
                        Tue_Total_Pay: 0,
                        Tue_OT_Hours: 0,
                        Tue_OT_Compensation: 0,
                        Tue_Late_Hours: 0,
                        Tue_Late_Deduction: 0,
                        Wed_Hours: 0,
                        Wed_Minutes: 0,
                        Wed_Date: 0,
                        Wed_Time_In: 0,
                        Wed_Time_Out: 0,
                        Wed_Total_Pay: 0,
                        Wed_OT_Hours: 0,
                        Wed_OT_Compensation: 0,
                        Wed_Late_Hours: 0,
                        Wed_Late_Deduction: 0,
                        Thu_Hours: 0,
                        Thu_Minutes: 0,
                        Thu_Date: 0,
                        Thu_Time_In: 0,
                        Thu_Time_Out: 0,
                        Thu_Total_Pay: 0,
                        Thu_OT_Hours: 0,
                        Thu_OT_Compensation: 0,
                        Thu_Late_Hours: 0,
                        Thu_Late_Deduction: 0,
                        Fri_Hours: 0,
                        Fri_Minutes: 0,
                        Fri_Date: 0,
                        Fri_Time_In: 0,
                        Fri_Time_Out: 0,
                        Fri_Total_Pay: 0,
                        Fri_OT_Hours: 0,
                        Fri_OT_Compensation: 0,
                        Fri_Late_Hours: 0,
                        Fri_Late_Deduction: 0,
                        Sat_Hours: 0, 
                        Sat_Minutes: 0,
                        Sat_Date: 0,
                        Sat_Time_In: 0,
                        Sat_Time_Out: 0,
                        Sat_Total_Pay: 0,
                        Sat_OT_Hours: 0,
                        Sat_OT_Compensation: 0,
                        Sat_Late_Hours: 0,
                        Sat_Late_Deduction: 0,
                        Sun_Hours: 0,
                        Sun_Minutes: 0,
                        Sun_Date: 0,
                        Sun_Time_In: 0,
                        Sun_Time_Out: 0,
                        Sun_Total_Pay: 0,
                        Sun_OT_Hours: 0,
                        Sun_OT_Compensation: 0,
                        Sun_Late_Hours: 0,
                        Sun_Late_Deduction: 0,
                        Weekly_Total_Advance: 0,
                        Weekly_Total_Additional: 0,
                        Weekly_Total_Deduction: 0,
                        Weekly_Total_Pay: 0,
                        Weekly_Hourly_Rate: 10,
                        Deduction_PAGIBIG_Contribution: 0,
                        Deduction_Philhealth: 0,
                        Deduction_SSS: 0
                    });
                    await new_payroll_1.save();

                    const new_payroll_2 = new payroll({
                        Email: email,
                        Week: 2,
                        Time_In_Weekday_Index: 0,
                        Mon_Hours: 0,
                        Mon_Minutes: 0,
                        Mon_Date: 0,
                        Mon_Time_In: 0,
                        Mon_Time_Out: 0,
                        Mon_Total_Pay: 0,
                        Mon_OT_Hours: 0,
                        Mon_OT_Compensation: 0,
                        Mon_Late_Hours: 0,
                        Mon_Late_Deduction: 0,
                        Tue_Hours: 0,
                        Tue_Minutes: 0,
                        Tue_Date: 0,
                        Tue_Time_In: 0,
                        Tue_Time_Out: 0,
                        Tue_Total_Pay: 0,
                        Tue_OT_Hours: 0,
                        Tue_OT_Compensation: 0,
                        Tue_Late_Hours: 0,
                        Tue_Late_Deduction: 0,
                        Wed_Hours: 0,
                        Wed_Minutes: 0,
                        Wed_Date: 0,
                        Wed_Time_In: 0,
                        Wed_Time_Out: 0,
                        Wed_Total_Pay: 0,
                        Wed_OT_Hours: 0,
                        Wed_OT_Compensation: 0,
                        Wed_Late_Hours: 0,
                        Wed_Late_Deduction: 0,
                        Thu_Hours: 0,
                        Thu_Minutes: 0,
                        Thu_Date: 0,
                        Thu_Time_In: 0,
                        Thu_Time_Out: 0,
                        Thu_Total_Pay: 0,
                        Thu_OT_Hours: 0,
                        Thu_OT_Compensation: 0,
                        Thu_Late_Hours: 0,
                        Thu_Late_Deduction: 0,
                        Fri_Hours: 0,
                        Fri_Minutes: 0,
                        Fri_Date: 0,
                        Fri_Time_In: 0,
                        Fri_Time_Out: 0,
                        Fri_Total_Pay: 0,
                        Fri_OT_Hours: 0,
                        Fri_OT_Compensation: 0,
                        Fri_Late_Hours: 0,
                        Fri_Late_Deduction: 0,
                        Sat_Hours: 0, 
                        Sat_Minutes: 0,
                        Sat_Date: 0,
                        Sat_Time_In: 0,
                        Sat_Time_Out: 0,
                        Sat_Total_Pay: 0,
                        Sat_OT_Hours: 0,
                        Sat_OT_Compensation: 0,
                        Sat_Late_Hours: 0,
                        Sat_Late_Deduction: 0,
                        Sun_Hours: 0,
                        Sun_Minutes: 0,
                        Sun_Date: 0,
                        Sun_Time_In: 0,
                        Sun_Time_Out: 0,
                        Sun_Total_Pay: 0,
                        Sun_OT_Hours: 0,
                        Sun_OT_Compensation: 0,
                        Sun_Late_Hours: 0,
                        Sun_Late_Deduction: 0,
                        Weekly_Total_Advance: 0,
                        Weekly_Total_Additional: 0,
                        Weekly_Total_Deduction: 0,
                        Weekly_Total_Pay: 0,
                        Weekly_Hourly_Rate: 10,
                        Deduction_PAGIBIG_Contribution: 0,
                        Deduction_Philhealth: 0,
                        Deduction_SSS: 0
                    });
                    await new_payroll_2.save();
                }
                //changes: end here
                res.json({success: true, message: "Registration Successful!"});
            }catch(error){
                console.error(error);
                res.status(500).json({success: false, message: "Registration Controller Error!"});
            }
        }
    }
} 

module.exports = register_controller;
