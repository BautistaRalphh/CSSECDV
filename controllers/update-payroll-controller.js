/*
Functions:
Updating the payroll on PST: Sunday 12am or UST: Saturday 4pm
Payroll: week 0 to week 1, week 1 to week 2, and week 0 to default values
*/

const payroll = require('../models/payroll_model.js');
const employee = require('../models/employee_model.js');
const database = require('../models/database.js');

const update_payroll_controller = {
    post_update_employee_payroll: async function (req, res){
        const employee_email_data = await database.findMany(employee, {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"}]});

        if(employee_email_data.length > 0){
            for(let i = 0; i < employee_email_data.length; i++){
                const employee_email = employee_email_data[i].Email;
                const week_1 = await database.findOne(payroll, {Email: employee_email, Week: 1});
                const week_0 = await database.findOne(payroll, {Email: employee_email, Week: 0});
                
                /* for week 0 only
                pagibig contribution:
                -php 1,500 and below = 1%; php over 1500 = 2%

                philhealth 
                -5% of weekly

                SSS
                -4.5% weekly
                */
                var PAGIBIG_Contribution = 0;
                if(week_0.Weekly_Total_Pay <= 1500){
                    PAGIBIG_Contribution = week_0.Weekly_Total_Pay * 0.01;
                }else{
                    PAGIBIG_Contribution = week_0.Weekly_Total_Pay * 0.02;
                }
                const Philhealth = week_0.Weekly_Total_Pay * 0.05;
                const SSS = week_0.Weekly_Total_Pay * 0.045;
                const Total_Pay = week_0.Weekly_Total_Pay - (PAGIBIG_Contribution + Philhealth + SSS);

                //updating the value of weekly pay and taxes
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Deduction_PAGIBIG_Contribution: PAGIBIG_Contribution,
                        Deduction_Philhealth: Philhealth,
                        Deduction_SSS: SSS,
                        Weekly_Total_Pay: Total_Pay
                    }
                });

                //updating the values of week 2 with week 1 values
                await database.updateOne(payroll, {Email: employee_email, Week: 2}, {
                    $set: {
                        Time_In_Weekday_Index: 0,
                        Mon_Hours: week_1.Mon_Hours,
                        Mon_Minutes: week_1.Mon_Minutes,
                        Mon_Date: week_1.Mon_Date,
                        Mon_Time_In: week_1.Mon_Time_In,
                        Mon_Time_Out: week_1.Mon_Time_Out,
                        Mon_Total_Pay: week_1.Mon_Total_Pay,
                        Mon_OT_Hours: week_1.Mon_OT_Hours,
                        Mon_OT_Compensation: week_1.Mon_OT_Compensation,
                        Mon_Late_Hours: week_1.Mon_Late_Hours,
                        Mon_Late_Deduction: week_1.Mon_Late_Deduction,
                        Tue_Hours: week_1.Tue_Hours,
                        Tue_Minutes: week_1.Tue_Minutes,
                        Tue_Date: week_1.Tue_Date,
                        Tue_Time_In: week_1.Tue_Time_In,
                        Tue_Time_Out: week_1.Tue_Time_Out,
                        Tue_Total_Pay: week_1.Tue_Total_Pay,
                        Tue_OT_Hours: week_1.Tue_OT_Hours,
                        Tue_OT_Compensation: week_1.Tue_OT_Compensation,
                        Tue_Late_Hours: week_1.Tue_Late_Hours,
                        Tue_Late_Deduction: week_1.Tue_Late_Deduction,
                        Wed_Hours: week_1.Wed_Hours,
                        Wed_Minutes: week_1.Wed_Minutes,
                        Wed_Date: week_1.Wed_Date,
                        Wed_Time_In: week_1.Wed_Time_In,
                        Wed_Time_Out: week_1.Wed_Time_Out,
                        Wed_Total_Pay: week_1.Wed_Total_Pay,
                        Wed_OT_Hours: week_1.Wed_OT_Hours,
                        Wed_OT_Compensation: week_1.Wed_OT_Compensation,
                        Wed_Late_Hours: week_1.Wed_Late_Hours,
                        Wed_Late_Deduction: week_1.Wed_Late_Deduction,
                        Thu_Hours: week_1.Thu_Hours,
                        Thu_Minutes: week_1.Thu_Minutes,
                        Thu_Date: week_1.Thu_Date,
                        Thu_Time_In: week_1.Thu_Time_In,
                        Thu_Time_Out: week_1.Thu_Time_Out,
                        Thu_Total_Pay: week_1.Thu_Total_Pay,
                        Thu_OT_Hours: week_1.Thu_OT_Hours,
                        Thu_OT_Compensation: week_1.Thu_OT_Compensation,
                        Thu_Late_Hours: week_1.Thu_Late_Hours,
                        Thu_Late_Deduction: week_1.Thu_Late_Deduction,
                        Fri_Hours: week_1.Fri_Hours,
                        Fri_Minutes: week_1.Fri_Minutes,
                        Fri_Date: week_1.Fri_Date,
                        Fri_Time_In: week_1.Fri_Time_In,
                        Fri_Time_Out: week_1.Fri_Time_Out,
                        Fri_Total_Pay: week_1.Fri_Total_Pay,
                        Fri_OT_Hours: week_1.Fri_OT_Hours,
                        Fri_OT_Compensation: week_1.Fri_OT_Compensation,
                        Fri_Late_Hours: week_1.Fri_Late_Hours,
                        Fri_Late_Deduction: week_1.Fri_Late_Deduction,
                        Sat_Hours: week_1.Sat_Hours,
                        Sat_Minutes: week_1.Sat_Minutes,
                        Sat_Date: week_1.Sat_Date,
                        Sat_Time_In: week_1.Sat_Time_In,
                        Sat_Time_Out: week_1.Sat_Time_Out,
                        Sat_Total_Pay: week_1.Sat_Total_Pay,
                        Sat_OT_Hours: week_1.Sat_OT_Hours,
                        Sat_OT_Compensation: week_1.Sat_OT_Compensation,
                        Sat_Late_Hours: week_1.Sat_Late_Hours,
                        Sat_Late_Deduction: week_1.Sat_Late_Deduction,
                        Sun_Hours: week_1.Sun_Hours,
                        Sun_Minutes: week_1.Sun_Minutes,
                        Sun_Date: week_1.Sun_Date,
                        Sun_Time_In: week_1.Sun_Time_In,
                        Sun_Time_Out: week_1.Sun_Time_Out,
                        Sun_Total_Pay: week_1.Sun_Total_Pay,
                        Sun_OT_Hours: week_1.Sun_OT_Hours,
                        Sun_OT_Compensation: week_1.Sun_OT_Compensation,
                        Sun_Late_Hours: week_1.Sun_Late_Hours,
                        Sun_Late_Deduction: week_1.Sun_Late_Deduction,
                        Weekly_Total_Advance: week_1.Weekly_Total_Advance,
                        Weekly_Total_Additional: week_1.Weekly_Total_Additional,
                        Weekly_Total_Deduction: week_1.Weekly_Total_Deduction,
                        Weekly_Total_Pay: week_1.Weekly_Total_Pay,
                        Weekly_Hourly_Rate: week_1.Weekly_Hourly_Rate,
                        Deduction_PAGIBIG_Contribution: week_1.Deduction_PAGIBIG_Contribution,
                        Deduction_Philhealth: week_1.Deduction_Philhealth,
                        Deduction_SSS: week_1.Deduction_SSS
                    }
                });
        
                //updating the values of week 1 with week 0 values
                await database.updateOne(payroll, {Email: employee_email, Week: 1}, {
                    $set: {
                        Time_In_Weekday_Index: 0,
                        Mon_Hours: week_0.Mon_Hours,
                        Mon_Minutes: week_0.Mon_Minutes,
                        Mon_Date: week_0.Mon_Date,
                        Mon_Time_In: week_0.Mon_Time_In,
                        Mon_Time_Out: week_0.Mon_Time_Out,
                        Mon_Total_Pay: week_0.Mon_Total_Pay,
                        Mon_OT_Hours: week_0.Mon_OT_Hours,
                        Mon_OT_Compensation: week_0.Mon_OT_Compensation,
                        Mon_Late_Hours: week_0.Mon_Late_Hours,
                        Mon_Late_Deduction: week_0.Mon_Late_Deduction,
                        Tue_Hours: week_0.Tue_Hours,
                        Tue_Minutes: week_0.Tue_Minutes,
                        Tue_Date: week_0.Tue_Date,
                        Tue_Time_In: week_0.Tue_Time_In,
                        Tue_Time_Out: week_0.Tue_Time_Out,
                        Tue_Total_Pay: week_0.Tue_Total_Pay,
                        Tue_OT_Hours: week_0.Tue_OT_Hours,
                        Tue_OT_Compensation: week_0.Tue_OT_Compensation,
                        Tue_Late_Hours: week_0.Tue_Late_Hours,
                        Tue_Late_Deduction: week_0.Tue_Late_Deduction,
                        Wed_Hours: week_0.Wed_Hours,
                        Wed_Minutes: week_0.Wed_Minutes,
                        Wed_Date: week_0.Wed_Date,
                        Wed_Time_In: week_0.Wed_Time_In,
                        Wed_Time_Out: week_0.Wed_Time_Out,
                        Wed_Total_Pay: week_0.Wed_Total_Pay,
                        Wed_OT_Hours: week_0.Wed_OT_Hours,
                        Wed_OT_Compensation: week_0.Wed_OT_Compensation,
                        Wed_Late_Hours: week_0.Wed_Late_Hours,
                        Wed_Late_Deduction: week_0.Wed_Late_Deduction,
                        Thu_Hours: week_0.Thu_Hours,
                        Thu_Minutes: week_0.Thu_Minutes,
                        Thu_Date: week_0.Thu_Date,
                        Thu_Time_In: week_0.Thu_Time_In,
                        Thu_Time_Out: week_0.Thu_Time_Out,
                        Thu_Total_Pay: week_0.Thu_Total_Pay,
                        Thu_OT_Hours: week_0.Thu_OT_Hours,
                        Thu_OT_Compensation: week_0.Thu_OT_Compensation,
                        Thu_Late_Hours: week_0.Thu_Late_Hours,
                        Thu_Late_Deduction: week_0.Thu_Late_Deduction,
                        Fri_Hours: week_0.Fri_Hours,
                        Fri_Minutes: week_0.Fri_Minutes,
                        Fri_Date: week_0.Fri_Date,
                        Fri_Time_In: week_0.Fri_Time_In,
                        Fri_Time_Out: week_0.Fri_Time_Out,
                        Fri_Total_Pay: week_0.Fri_Total_Pay,
                        Fri_OT_Hours: week_0.Fri_OT_Hours,
                        Fri_OT_Compensation: week_0.Fri_OT_Compensation,
                        Fri_Late_Hours: week_0.Fri_Late_Hours,
                        Fri_Late_Deduction: week_0.Fri_Late_Deduction,
                        Sat_Hours: week_0.Sat_Hours,
                        Sat_Minutes: week_0.Sat_Minutes,
                        Sat_Date: week_0.Sat_Date,
                        Sat_Time_In: week_0.Sat_Time_In,
                        Sat_Time_Out: week_0.Sat_Time_Out,
                        Sat_Total_Pay: week_0.Sat_Total_Pay,
                        Sat_OT_Hours: week_0.Sat_OT_Hours,
                        Sat_OT_Compensation: week_0.Sat_OT_Compensation,
                        Sat_Late_Hours: week_0.Sat_Late_Hours,
                        Sat_Late_Deduction: week_0.Sat_Late_Deduction,
                        Sun_Hours: week_0.Sun_Hours,
                        Sun_Minutes: week_0.Sun_Minutes,
                        Sun_Date: week_0.Sun_Date,
                        Sun_Time_In: week_0.Sun_Time_In,
                        Sun_Time_Out: week_0.Sun_Time_Out,
                        Sun_Total_Pay: week_0.Sun_Total_Pay,
                        Sun_OT_Hours: week_0.Sun_OT_Hours,
                        Sun_OT_Compensation:  week_0.Sun_OT_Compensation,
                        Sun_Late_Hours:  week_0.Sun_Late_Hours,
                        Sun_Late_Deduction:  week_0.Sun_Late_Deduction,
                        Weekly_Total_Advance: week_0.Weekly_Total_Advance,
                        Weekly_Total_Additional: week_0.Weekly_Total_Additional,
                        Weekly_Total_Deduction: week_0.Weekly_Total_Deduction,
                        Weekly_Total_Pay: week_0.Weekly_Total_Pay,
                        Weekly_Hourly_Rate: week_0.Weekly_Hourly_Rate,
                        Deduction_PAGIBIG_Contribution: week_0.Deduction_PAGIBIG_Contribution,
                        Deduction_Philhealth: week_0.Deduction_Philhealth,
                        Deduction_SSS: week_0.Deduction_SSS
                    }
                });
        
                //updating the values of week 0 with default values
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
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
                    }
                });
            }
        }

    }
} 

module.exports = update_payroll_controller;