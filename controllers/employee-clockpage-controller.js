/*
Functions:
-Display the employee-clockpage.hbs (Employee Clockpage) or work-from-home-clockpage.hbs (Work From Home Clock Page) depending on the employee type
-Update the employee time-in status
-Update the payroll with time-in/out logs, date of time-in, and calculations for total hours and minutes per day, total day pay, and weekly total pay
*/

const employee = require('../models/employee_model.js');
const payroll = require('../models/payroll_model.js');
const database = require('../models/database.js');

const employee_clockpage_controller = {
    get_employee_clockpage: function (req, res){
        res.render("employee-clockpage", {email: req.session.Email, emp_type: req.session.Employee_type});
    },

    get_wfh_clockpage: function(req, res){
        res.render("work-from-home-clockpage", {email: req.session.Email, emp_type: req.session.Employee_type});
    },

    get_employee_time_in_status: async function(req, res){
        try{
            const employee_email = req.session.Email;
            
            current_employee = await database.findOne(employee,{Email: employee_email});
            
            const time_in_status = current_employee.IsTimedIn;
    
            res.json({time_in_status});
        }catch(err){
            res.status(500).send("Internal Server Error!");
        }
    },

    post_employee_time_in: async function (req, res) {
            const { Time_In, TI_weekdayIndex, Time_In_Date } = req.body;
            const employee_email = req.session.Email;

            let regular_holiday = ["01-01", "03-28", "03-29", "04-09", "05-01", "06-12", "08-26", "11-30", "12-25", "12-30"];
            function is_regular_holiday(date) {
                let month_day = date.slice(5, 10);
                return regular_holiday.includes(month_day);
            }

            const day = await database.findOne(payroll, { Email: employee_email, Week: 0 });

            function getPreviousDates(currentDate) {
                let date = new Date(currentDate);
                let previousDate = new Date(date);
                previousDate.setDate(date.getDate() - 1);
                var day = previousDate.toISOString().slice(0, 10)
            
                return day;
            }

            const dates = getPreviousDates(Time_In_Date);
            console.log("variable dates = ", dates);
            const prevDay_weekdayIndex = TI_weekdayIndex - 1;

            if (dates !== day.Mon_Date || dates !== day.Tue_Date || dates !== day.Wed_Date || dates !== day.Thu_Date || dates !== day.Fri_Date || dates !== day.Sat_Date || dates !== day.Sun_Date) {
                console.log("inside the if dates !=");
                if (is_regular_holiday(dates)) {
                    const day_pay = 8 * day.Weekly_Hourly_Rate;
                    const weekly_pay = day_pay + day.Weekly_Total_Pay;
                    if (prevDay_weekdayIndex === 1) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Mon_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Mon_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    } else if (prevDay_weekdayIndex === 2) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Tue_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Tue_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    } else if (prevDay_weekdayIndex === 3) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Wed_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Wed_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    } else if (prevDay_weekdayIndex === 4) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Thu_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Thu_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    } else if (prevDay_weekdayIndex === 5) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Fri_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Fri_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    } else if (prevDay_weekdayIndex === 6) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Sat_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Sat_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    } else if (prevDay_weekdayIndex === 0) {
                        await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                            $set: {
                                Sun_Date: dates,
                                Time_In_Weekday_Index: prevDay_weekdayIndex,
                                Sun_Total_Pay: day_pay,
                                Weekly_Total_Pay: weekly_pay
                            }
                        });
                    }
                }
                
            }

            await database.updateOne(employee, { Email: req.session.Email }, { IsTimedIn: true })
            if (TI_weekdayIndex === 1) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Mon_Time_In: Time_In,
                        Mon_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            } else if (TI_weekdayIndex === 2) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Tue_Time_In: Time_In,
                        Tue_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            } else if (TI_weekdayIndex === 3) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Wed_Time_In: Time_In,
                        Wed_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            } else if (TI_weekdayIndex === 4) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Thu_Time_In: Time_In,
                        Thu_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            } else if (TI_weekdayIndex === 5) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Fri_Time_In: Time_In,
                        Fri_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            } else if (TI_weekdayIndex === 6) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Sat_Time_In: Time_In,
                        Sat_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            } else if (TI_weekdayIndex === 0) {
                await database.updateOne(payroll, { Email: employee_email, Week: 0 }, {
                    $set: {
                        Sun_Time_In: Time_In,
                        Sun_Date: Time_In_Date,
                        Time_In_Weekday_Index: TI_weekdayIndex,
                    }
                });
            }
            res.render("employee-clockpage", { email: req.session.Email, emp_type: req.session.Employee_type, ETI_weekdayIndex: req.session.ETI_weekdayIndex });
            res.render("employee-clockpage", { email: req.session.Email, emp_type: req.session.Employee_type });
    },

    post_employee_time_out: async function (req, res){
        const {TO_hour, TO_minute, TO_weekdayIndex} = req.body;
        const employee_email = req.session.Email;
        const Time_Out = TO_hour + ':' + TO_minute;
        const TO_hour_int = parseInt(TO_hour);
        const TO_minute_int = parseInt(TO_minute);

        const day = await database.findOne(payroll, {Email: employee_email, Week: 0});
        const current_employee = await database.findOne(employee, {Email: employee_email});
        await database.updateOne(employee, {Email: req.session.Email}, {IsTimedIn: false})
        const hr = day.Weekly_Hourly_Rate;
        const mr = (hr/60).toFixed(2);
        const TI_weekdayIndex = day.Time_In_Weekday_Index;

        //++
        let regular_holiday = ["01-01", "03-28", "03-29", "04-09", "05-01", "06-12", "08-26", "11-30", "12-25", "12-30",];
        let special_holiday = ["02-10", "03-30", "08-21", "11-01", "11-02", "12-08", "12-24", "12-31"];

        function is_regular_holiday(date) {
            
            let month_day = date.slice(5, 10);
            return regular_holiday.includes(month_day);
        }

        function is_special_holiday(date) {
            
            let month_day = date.slice(5, 10);
            return special_holiday.includes(month_day);
        }
        //--

        //++
        const start_of_regular_time = 8 * 60;
        const end_of_regular_time = 17 * 60;
        //--

        if(TI_weekdayIndex === 1){
            let [hours, minutes] = day.Mon_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            }

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Mon_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Mon_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            // const total_day_pay = total_hours*hr + total_minutes*mr;
            // const Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            try{
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Mon_Time_Out: Time_Out,
                        Mon_Hours: total_hours,
                        Mon_Minutes: total_minutes,
                        Mon_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Mon_OT_Hours: overtime_hours,
                        Mon_OT_Compensation: overtime_pay,
                        Mon_Late_Hours: late_hours,
                        Mon_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }else if(TI_weekdayIndex === 2){
            let [hours, minutes] = day.Tue_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            }

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Tue_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Tue_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            try{
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Tue_Time_Out: Time_Out,
                        Tue_Hours: total_hours,
                        Tue_Minutes: total_minutes,
                        Tue_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Tue_OT_Hours: overtime_hours,
                        Tue_OT_Compensation: overtime_pay,
                        Tue_Late_Hours: late_hours,
                        Tue_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }else if(TI_weekdayIndex === 3){
            let [hours, minutes] = day.Wed_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            }

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Wed_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Wed_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            try{
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Wed_Time_Out: Time_Out,
                        Wed_Hours: total_hours,
                        Wed_Minutes: total_minutes,
                        Wed_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Wed_OT_Hours: overtime_hours,
                        Wed_OT_Compensation: overtime_pay,
                        Wed_Late_Hours: late_hours,
                        Wed_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }else if(TI_weekdayIndex === 4){
            let [hours, minutes] = day.Thu_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            }

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Thu_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Thu_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            try{
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Thu_Time_Out: Time_Out,
                        Thu_Hours: total_hours,
                        Thu_Minutes: total_minutes,
                        Thu_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Thu_OT_Hours: overtime_hours,
                        Thu_OT_Compensation: overtime_pay,
                        Thu_Late_Hours: late_hours,
                        Thu_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }else if(TI_weekdayIndex === 5){
            let [hours, minutes] = day.Fri_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            }

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Fri_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Fri_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            try{
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Fri_Time_Out: Time_Out,
                        Fri_Hours: total_hours,
                        Fri_Minutes: total_minutes,
                        Fri_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Fri_OT_Hours: overtime_hours,
                        Fri_OT_Compensation: overtime_pay,
                        Fri_Late_Hours: late_hours,
                        Fri_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }else if(TI_weekdayIndex === 6){
            let [hours, minutes] = day.Sat_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            } 

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Sat_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Sat_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            try{//add the creation of new payroll here per employee
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Sat_Time_Out: Time_Out,
                        Sat_Hours: total_hours,
                        Sat_Minutes: total_minutes,
                        Sat_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Sat_OT_Hours: overtime_hours,
                        Sat_OT_Compensation: overtime_pay,
                        Sat_Late_Hours: late_hours,
                        Sat_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }else if(TI_weekdayIndex === 0){//sunday keep or remove
            let [hours, minutes] = day.Sun_Time_In.split(':');
            const TI_hour = parseInt(hours);
            const TI_minute = parseInt(minutes);
            const time_in_total_minutes = TI_hour * 60 + TI_minute;

            //++
            let late_penalty = 0;
            let late_hours = 0;
            if (time_in_total_minutes > start_of_regular_time) {
                const late_minutes = time_in_total_minutes - start_of_regular_time;
                late_hours = Math.ceil(late_minutes / 60); 
                late_penalty = late_hours * hr;
            }
            //--

            var time_out_total_minutes;
            if(TI_weekdayIndex !== TO_weekdayIndex){
                time_out_total_minutes = 23 * 60 + 59;
            }else{
                time_out_total_minutes = TO_hour_int * 60 + TO_minute_int;
            }
            const total_time = time_out_total_minutes - time_in_total_minutes;

            if(total_time < 0){
                total_time += 24 * 60;
            } 

            const total_hours = Math.floor(total_time / 60);
            const total_minutes = total_time % 60;

            //++
            const regular_time = Math.min(time_out_total_minutes, end_of_regular_time) - time_in_total_minutes;
            const overtime = Math.max(time_out_total_minutes - end_of_regular_time, 0);
            const regular_hours = Math.floor(regular_time / 60);
            const regular_minutes = regular_time % 60;
            const overtime_hours = Math.floor(overtime / 60);
            const overtime_minutes = overtime % 60;
            var overtime_rate = hr * 1.5;
            var overtime_pay;
            var total_day_pay;
            var Weekly_Pay;

            if(is_regular_holiday(day.Sun_Date)){
                const hr_rh = hr*2;
                const mr_rh = (hr_rh/60).toFixed(2);
                const regular_pay = regular_hours * hr_rh + regular_minutes * mr_rh;
                const overtime_rate_rh = overtime_rate*1.3;

                overtime_pay = overtime_hours * overtime_rate_rh + overtime_minutes * (overtime_rate_rh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else if(is_special_holiday(day.Sun_Date)){
                const hr_sh = hr*1.3;
                const mr_sh = (hr_sh/60).toFixed(2);
                const regular_pay = regular_hours * hr_sh + regular_minutes * mr_sh;
                const overtime_rate_sh = overtime_rate * 1.3;

                overtime_pay = overtime_hours * overtime_rate_sh + overtime_minutes * (overtime_rate_sh / 60);
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;

            }else{
                const regular_pay = regular_hours * hr + regular_minutes * mr;

                overtime_pay = overtime_hours * overtime_rate + overtime_minutes * (overtime_rate / 60);                
                total_day_pay = regular_pay + overtime_pay - late_penalty;
                Weekly_Pay = day.Weekly_Total_Pay + total_day_pay;
            }
            //--

            try{
                await database.updateOne(payroll, {Email: employee_email, Week: 0}, {
                    $set: {
                        Sun_Time_Out: Time_Out,
                        Sun_Hours: total_hours,
                        Sun_Minutes: total_minutes,
                        Sun_Total_Pay: total_day_pay,
                        Weekly_Total_Pay: Weekly_Pay,
                        Sun_OT_Hours: overtime_hours,
                        Sun_OT_Compensation: overtime_pay,
                        Sun_Late_Hours: late_hours,
                        Sun_Late_Deduction: late_penalty
                    }
                });
                if(current_employee.Employee_Type === "Employee"){
                    res.status(200).json({ success: true, type: "Emp", message: "Time out recorded successfully!" });
                }else{
                    res.status(200).json({ success: true, type: "WFH", message: "Time out recorded successfully!" });
                }
                
            }catch(error){
                console.error(error);
                res.status(500).json({ success: false, message: "Error recording time out!" });
            }
        }
    }

}

module.exports = employee_clockpage_controller;
