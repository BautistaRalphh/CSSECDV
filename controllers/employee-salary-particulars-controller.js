const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs'); 
const payroll = require('../models/payroll_model.js');
const employee = require('../models/employee_model.js');
const database = require('../models/database.js');

const employee_salary_particulars_controllers = {
    // get_salary_particulars: function(req, res){
    //     res.render("employee-salaryParticulars", {email: req.session.Email, emp_type: req.session.Employee_type, ETI_weekdayIndex: req.session.ETI_weekdayIndex});
    // },
    
    get_salary_particulars: async function (req, res){
        const employee_email = req.session.Email;
        try{
            const emp_rec = await database.findOne(employee, {Email: employee_email});
            const emp_pay = await database.findOne(payroll, {Email: employee_email, Week: 1});
            //Overtime Pay & Hours
            const Total_OT_Hours = emp_pay.Mon_OT_Hours + emp_pay.Tue_OT_Hours + emp_pay.Wed_OT_Hours + 
                                    emp_pay.Thu_OT_Hours + emp_pay.Fri_OT_Hours + emp_pay.Sat_OT_Hours + emp_pay.Sun_OT_Hours;
            const Total_OT_Compensation = emp_pay.Mon_OT_Compensation + emp_pay.Tue_OT_Compensation + emp_pay.Wed_OT_Compensation + 
                                            emp_pay.Thu_OT_Compensation + emp_pay.Fri_OT_Compensation + emp_pay.Sat_OT_Compensation + emp_pay.Sun_OT_Compensation;
            
            //Basic Pay & Hours
            const Total_Hours = emp_pay.Mon_Hours + emp_pay.Tue_Hours + emp_pay.Wed_Hours + emp_pay.Thu_Hours + 
                                emp_pay.Fri_Hours + emp_pay.Sat_Hours + emp_pay.Sun_Hours;
            const Total_Basic_Hours = Total_Hours - Total_OT_Hours;
            const Total_Pay = emp_pay.Mon_Total_Pay + emp_pay.Tue_Total_Pay + emp_pay.Wed_Total_Pay + emp_pay.Thu_Total_Pay + 
                                emp_pay.Fri_Total_Pay + emp_pay.Sat_Total_Pay + emp_pay.Sun_Total_Pay;
            const Total_Basic_Pay = Total_Pay - Total_OT_Compensation;
            console.log("Total_OT_Compensation: ", Total_OT_Compensation );
            console.log("BASIC PAY: ", Total_Basic_Pay );

            //Holiday
            let regular_holiday = ["01-01", "03-28", "03-29", "04-09", "05-01", "06-12", "08-26", "11-30", "12-25", "12-30",];
            let special_holiday = ["02-10", "03-30", "08-21", "11-01", "11-02", "12-08", "12-24", "12-31"];

            function is_regular_holiday(date){
                let month_day = date.slice(5, 10);
                return regular_holiday.includes(month_day);
            }

            function is_special_holiday(date){
                let month_day = date.slice(5, 10);
                return special_holiday.includes(month_day);
            }
            var Total_Holiday_Hours = 0;
            var Total_Holiday_Pay = 0;
            if(is_regular_holiday(emp_pay.Mon_Date) || is_special_holiday(emp_pay.Mon_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Mon_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Mon_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Tue_Date) || is_special_holiday(emp_pay.Tue_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Tue_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Tue_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Wed_Date) || is_special_holiday(emp_pay.Wed_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Wed_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Wed_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Thu_Date) || is_special_holiday(emp_pay.Thu_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Thu_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Thu_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Fri_Date) || is_special_holiday(emp_pay.Fri_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Fri_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Fri_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Sat_Date) || is_special_holiday(emp_pay.Sat_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Sat_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Sat_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Sun_Date) || is_special_holiday(emp_pay.Sun_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Sun_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Sun_Total_Pay;
            }

            res.render("employee-salaryParticulars", {email: req.session.Email, emp_type: req.session.Employee_type, ETI_weekdayIndex: req.session.ETI_weekdayIndex, 
                emp_rec, emp_pay, Total_Basic_Hours, Total_Basic_Pay, Total_OT_Hours, Total_OT_Compensation, Total_Holiday_Hours, Total_Holiday_Pay});
        }catch (error){
            console.error("Error processing employee details: ", error);
            res.status(500).send("Internal Server Error!");
        }
    },

    post_print_salary_particulars: async function(req, res){
        const employee_email = req.session.Email;
        try {
            const emp_rec = await database.findOne(employee, {Email: employee_email});
            const emp_pay = await database.findOne(payroll, {Email: employee_email, Week: 1});

            // OverTime
            const Total_OT_Hours = emp_pay.Mon_OT_Hours + emp_pay.Tue_OT_Hours + emp_pay.Wed_OT_Hours + 
                                    emp_pay.Thu_OT_Hours + emp_pay.Fri_OT_Hours + emp_pay.Sat_OT_Hours + emp_pay.Sun_OT_Hours;
            const Total_OT_Compensation = emp_pay.Mon_OT_Compensation + emp_pay.Tue_OT_Compensation + emp_pay.Wed_OT_Compensation + 
                                            emp_pay.Thu_OT_Compensation + emp_pay.Fri_OT_Compensation + emp_pay.Sat_OT_Compensation + emp_pay.Sun_OT_Compensation;

            // Basic Pay & Hours
            const Total_Hours = emp_pay.Mon_Hours + emp_pay.Tue_Hours + emp_pay.Wed_Hours + emp_pay.Thu_Hours + 
                                emp_pay.Fri_Hours + emp_pay.Sat_Hours + emp_pay.Sun_Hours;
            const Total_Basic_Hours = Total_Hours - Total_OT_Hours;
            const Total_Pay = emp_pay.Mon_Total_Pay + emp_pay.Tue_Total_Pay + emp_pay.Wed_Total_Pay + emp_pay.Thu_Total_Pay + 
                                emp_pay.Fri_Total_Pay + emp_pay.Sat_Total_Pay + emp_pay.Sun_Total_Pay;
            const Total_Basic_Pay = Total_Pay - Total_OT_Compensation;

            //Holiday
            let regular_holiday = ["01-01", "03-28", "03-29", "04-09", "05-01", "06-12", "08-26", "11-30", "12-25", "12-30"];
            let special_holiday = ["02-10", "03-30", "08-21", "11-01", "11-02", "12-08", "12-24", "12-31"];

            function is_regular_holiday(date){
                let month_day = date.slice(5, 10);
                return regular_holiday.includes(month_day);
            }

            function is_special_holiday(date){
                let month_day = date.slice(5, 10);
                return special_holiday.includes(month_day);
            }

            var Total_Holiday_Hours = 0;
            var Total_Holiday_Pay = 0;
            if(is_regular_holiday(emp_pay.Mon_Date) || is_special_holiday(emp_pay.Mon_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Mon_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Mon_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Tue_Date) || is_special_holiday(emp_pay.Tue_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Tue_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Tue_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Wed_Date) || is_special_holiday(emp_pay.Wed_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Wed_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Wed_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Thu_Date) || is_special_holiday(emp_pay.Thu_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Thu_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Thu_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Fri_Date) || is_special_holiday(emp_pay.Fri_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Fri_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Fri_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Sat_Date) || is_special_holiday(emp_pay.Sat_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Sat_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Sat_Total_Pay;
            }
            if(is_regular_holiday(emp_pay.Sun_Date) || is_special_holiday(emp_pay.Sun_Date)){
                Total_Holiday_Hours = Total_Holiday_Hours + emp_pay.Sun_Hours;
                Total_Holiday_Pay = Total_Holiday_Pay + emp_pay.Sun_Total_Pay;
            }

            const doc = new PDFDocument();
            const desktopPath = path.join(require('os').homedir(), 'Desktop');
            const filePath = path.join(desktopPath, 'salary_particulars.pdf');
            console.log("File path:", filePath);//remove later

            doc.pipe(fs.createWriteStream(filePath))
            doc.pipe(res)

            doc.fontSize(20).text('Employee Salary Particulars', {align: 'center'});
            doc.moveDown();

            doc.fontSize(14).text(`Name: ${emp_rec.First_Name} ${emp_rec.Last_Name}`);
            doc.fontSize(14).text(`Email: ${emp_rec.Email}`);
            doc.fontSize(14).text(`Employee Type: ${emp_rec.Employee_Type}`);
            doc.moveDown();

            doc.fontSize(14)
                .text('Basic Pay (Hour):', {continued: true})
                .text(`${Total_Basic_Hours}`, {align: 'right'})
            doc.fontSize(14)
                .text('Basic Pay (Amount):', {continued:true})
                .text(`${Total_Basic_Pay}`, {align: 'right'});
            doc.fontSize(14)
                .text('Overtime Rate (Hour):', {continued: true})
                .text(`${Total_OT_Hours}`, {align: 'right'})
            doc.fontSize(14)
                .text('Overtime Rate (Amount):', {continued:true})
                .text(`${Total_OT_Compensation}`, {align: 'right'});
            doc.fontSize(14)
                .text('Holiday (Hour):', {continued: true})
                .text(`${Total_Holiday_Hours}`, {align: 'right'})
            doc.fontSize(14)
                .text('Holiday (Amount):', {continued:true})
                .text(`${Total_Holiday_Pay}`, {align: 'right'});

            doc.fontSize(14).text('Deductions');
            doc.fontSize(14)
                .text('PAGIBIG Contribution:', {continued: true})
                .text(`${emp_pay.Deduction_PAGIBIG_Contribution}`, {align: 'right'});
            doc.fontSize(14)
                .text('Philhealth:', {continued: true})
                .text(`${emp_pay.Deduction_Philhealth}`, {align: 'right'});
            doc.fontSize(14)
                .text('SSS:', {continued: true})
                .text(`${emp_pay.Deduction_SSS}`, {align: 'right'});
            doc.fontSize(14)
                .text('Cash-Advance:', {continued: true})
                .text(`${emp_pay.Weekly_Total_Advance}`, {align: 'right'})
            doc.fontSize(14)
                .text('NET PAY:', {continued: true})
                .text(`₱${emp_pay.Weekly_Total_Pay}`, {align: 'right'});
            doc.end();
        }catch (error){
            console.error("Error processing employee details: ", error);
            res.status(500).send("Internal Server Error!");
        }
    }
}

module.exports = employee_salary_particulars_controllers;