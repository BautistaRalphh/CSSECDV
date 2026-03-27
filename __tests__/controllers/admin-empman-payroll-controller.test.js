const database = require('../../models/database');
const employee = require('../../models/employee_model');
const payroll = require('../../models/payroll_model');
const admin_empman_payroll_controller = require('../../controllers/admin-empman-payroll-controller');
const httpMocks = require('node-mocks-http');
const { query } = require('express');
const { json } = require('body-parser');

jest.mock('../../models/database');
jest.mock('../../models/employee_model');
jest.mock('../../models/payroll_model');

describe('admin-empman-payroll-controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            body: {}
        };

        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

    });

    describe('get_admin_empman_payroll', () => {
        it('should render the admin-empan-payroll-view', () => {
            //simulate ther request
            admin_empman_payroll_controller.get_admin_empman_payroll(req, res);

            //render the correct page
            expect(res.render).toHaveBeenCalledWith('admin-empman-payroll');
        });

    });

    describe('get_emp_total', () => {

        it('should render the admin-empman-payroll view with employee total', async () => {
            //set up the mock data
            const mockEmployees = [
                { Email: 'a@example.com', Employee_Type: 'Employee' },
                { Email: 'c@example.com', Employee_Type: 'Work From Home' },
                { Email: 'b@example.com', Employee_Type: 'Employee' }
            ];
            
            //simulate the query
            database.findMany.mockResolvedValue(mockEmployees);

            await admin_empman_payroll_controller.get_emp_total(req, res);

            //sort the emails
            mockEmployees.sort((a, b) => a.Email.localeCompare(b.Email));

            //assert that the correct table [employee] is being used
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [
                    { Employee_Type: "Employee" },
                    { Employee_Type: "Work From Home" }
                ]
            });

            //render the page with the correct data 
            expect(res.render).toHaveBeenCalledWith('admin-empman-payroll', { emp_total: mockEmployees });
        })

        it('should handle errors gracefully', async () => {

            //simulate error
            database.findMany.mockRejectedValue(new Error('Database Error'));

            await admin_empman_payroll_controller.get_emp_total(req, res);

            //check that 500 status code has been sent
            expect(res.status).toHaveBeenCalledWith(500);
            //check that error message has been sent
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        });
    });

    describe('get_emp_wpay', () => {

        it('should render the admin-empman-payroll view with employee weekly payroll', async () => {

            req.query = { employee: 'a@example.com', week: '1' };

            //set up mock employee payroll
            const mockEmployeePayroll = {
                Email: 'a@example.com',
                Week: '1',
                Weekly_Hourly_Rate: 100,
                Sun_Hours: 8,
                Sun_Minutes: 30,
                Mon_Hours: 8,
                Mon_Minutes: 0,
                Tue_Hours: 8,
                Tue_Minutes: 0,
                Wed_Hours: 8,
                Wed_Minutes: 0,
                Thu_Hours: 8,
                Thu_Minutes: 0,
                Fri_Hours: 8,
                Fri_Minutes: 0,
                Sat_Hours: 8,
                Sat_Minutes: 0,
                Sun_Late_Hours: 0,
                Sun_OT_Hours: 0,
                Mon_Late_Hours: 0,
                Mon_OT_Hours: 0,
                Tue_Late_Hours: 0,
                Tue_OT_Hours: 0,
                Wed_Late_Hours: 0,
                Wed_OT_Hours: 0,
                Thu_Late_Hours: 0,
                Thu_OT_Hours: 0,
                Fri_Late_Hours: 0,
                Fri_OT_Hours: 0,
                Sat_Late_Hours: 0,
                Sat_OT_Hours: 0,
                Sun_Date: '2024-07-28',
                Mon_Date: '2024-07-29',
                Tue_Date: '2024-07-30',
                Wed_Date: '2024-07-31',
                Thu_Date: '2024-08-01',
                Fri_Date: '2024-08-02',
                Sat_Date: '2024-08-03'
            };

            //set up mock employees
            const mockEmployees = [
                { Email: 'a@example.com', Employee_Type: 'Employee' },
                { Email: 'c@example.com', Employee_Type: 'Work From Home' },
                { Email: 'b@example.com', Employee_Type: 'Employee' }
            ];

            //perform the queries for the payroll and employees
            database.findOne.mockResolvedValue(mockEmployeePayroll);
            database.findMany.mockResolvedValue(mockEmployees);

            await admin_empman_payroll_controller.get_emp_wpay(req, res);
            
            const Weekly_Minute_Rate = (mockEmployeePayroll.Weekly_Hourly_Rate / 60).toFixed(2);

            //calculate expected rates
            const Total_Hour_Rate = [
                mockEmployeePayroll.Sun_Hours * mockEmployeePayroll.Weekly_Hourly_Rate,
                mockEmployeePayroll.Mon_Hours * mockEmployeePayroll.Weekly_Hourly_Rate,
                mockEmployeePayroll.Tue_Hours * mockEmployeePayroll.Weekly_Hourly_Rate,
                mockEmployeePayroll.Wed_Hours * mockEmployeePayroll.Weekly_Hourly_Rate,
                mockEmployeePayroll.Thu_Hours * mockEmployeePayroll.Weekly_Hourly_Rate,
                mockEmployeePayroll.Fri_Hours * mockEmployeePayroll.Weekly_Hourly_Rate,
                mockEmployeePayroll.Sat_Hours * mockEmployeePayroll.Weekly_Hourly_Rate
            ];


            const Total_Minute_Rate = [
                (mockEmployeePayroll.Sun_Minutes * Weekly_Minute_Rate).toFixed(2),
                (mockEmployeePayroll.Mon_Minutes * Weekly_Minute_Rate).toFixed(2),
                (mockEmployeePayroll.Tue_Minutes * Weekly_Minute_Rate).toFixed(2),
                (mockEmployeePayroll.Wed_Minutes * Weekly_Minute_Rate).toFixed(2),
                (mockEmployeePayroll.Thu_Minutes * Weekly_Minute_Rate).toFixed(2),
                (mockEmployeePayroll.Fri_Minutes * Weekly_Minute_Rate).toFixed(2),
                (mockEmployeePayroll.Sat_Minutes * Weekly_Minute_Rate).toFixed(2)
            ];

            //sort the employee emails
            mockEmployees.sort((a, b) => a.Email.localeCompare(b.Email));

            //perform query in payroll table
            expect(database.findOne).toHaveBeenCalledWith(payroll, {
                Email: 'a@example.com',
                Week: '1'
            });

            //perform querry in the employee table
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [
                    { Employee_Type: "Employee" },
                    { Employee_Type: "Work From Home" }
                ]
            });

            //render the page with the correct expected data
            expect(res.render).toHaveBeenCalledWith('admin-empman-payroll', {
                emp_wpay: mockEmployeePayroll,
                emp_total: mockEmployees,
                Total_Hour_Rate: Total_Hour_Rate,
                Total_Minute_Rate: Total_Minute_Rate
            });
        });

        it('should handle errors gracefully', async () => {
            //set up the query
            req.query = {
                employee: 'a@example.com',
                week: '1'
            };

            //simulate the error
            database.findOne.mockRejectedValue(new Error('Database Error'));

            await admin_empman_payroll_controller.get_emp_wpay(req, res);

            //error status and message
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        })
    });

    describe('post_update_payroll', () => {

        //failed
        it('should update payroll data and return success message', async () => {

            //set up
            req.body = {
                PPH: 100, PPM: 1.67, Additional: 500, Advance: 200, Deduction: 100,
                Payroll_ID: '12345', cur_email: 'a@example.com', cur_week: '1'
            };

            //set up mock payroll
            const mockPayroll = {
                _id: '12345',
                Mon_Hours: 8, Mon_Minutes: 30, Mon_Late_Hours: 0, Mon_OT_Hours: 1, Mon_Date: '2024-07-01',
                Tue_Hours: 8, Tue_Minutes: 30, Tue_Late_Hours: 0, Tue_OT_Hours: 1, Tue_Date: '2024-07-02',
                Wed_Hours: 8, Wed_Minutes: 30, Wed_Late_Hours: 0, Wed_OT_Hours: 1, Wed_Date: '2024-07-03',
                Thu_Hours: 8, Thu_Minutes: 30, Thu_Late_Hours: 0, Thu_OT_Hours: 1, Thu_Date: '2024-07-04',
                Fri_Hours: 8, Fri_Minutes: 30, Fri_Late_Hours: 0, Fri_OT_Hours: 1, Fri_Date: '2024-07-05',
                Sat_Hours: 8, Sat_Minutes: 30, Sat_Late_Hours: 0, Sat_OT_Hours: 1, Sat_Date: '2024-07-06',
                Sun_Hours: 8, Sun_Minutes: 30, Sun_Late_Hours: 0, Sun_OT_Hours: 1, Sun_Date: '2024-07-07',
                Weekly_Total_Additional: 0, Weekly_Total_Advance: 0, Weekly_Total_Deduction: 0
            };

            //perform the operations
            database.findOne.mockResolvedValue(mockPayroll);
            database.updateOne.mockResolvedValue({});

            await admin_empman_payroll_controller.post_update_payroll(req, res);

            //validate that the payroll data has been updated
            expect(database.updateOne).toHaveBeenCalledWith(payroll, { _id: req.body.Payroll_ID }, expect.any(Object));
            expect(res.json).toHaveBeenCalledWith(JSON.stringify({ success: true, message: "Payroll updated successfully!" }));
        });
        

        //failed
        it('should return an error message if update fails', async () => {
            //set up
            req.body = {
                PPH: 100, PPM: 1.67, Additional: 500, Advance: 200, Deduction: 100,
                Payroll_ID: '12345', cur_email: 'a@example.com', cur_week: '1'
            };

            const mockPayroll = {
                 _id: '12345',
                Mon_Hours: 8, Mon_Minutes: 30, Mon_Late_Hours: 0, Mon_OT_Hours: 1, Mon_Date: '2024-07-01',
                Tue_Hours: 8, Tue_Minutes: 30, Tue_Late_Hours: 0, Tue_OT_Hours: 1, Tue_Date: '2024-07-02',
                Wed_Hours: 8, Wed_Minutes: 30, Wed_Late_Hours: 0, Wed_OT_Hours: 1, Wed_Date: '2024-07-03',
                Thu_Hours: 8, Thu_Minutes: 30, Thu_Late_Hours: 0, Thu_OT_Hours: 1, Thu_Date: '2024-07-04',
                Fri_Hours: 8, Fri_Minutes: 30, Fri_Late_Hours: 0, Fri_OT_Hours: 1, Fri_Date: '2024-07-05',
                Sat_Hours: 8, Sat_Minutes: 30, Sat_Late_Hours: 0, Sat_OT_Hours: 1, Sat_Date: '2024-07-06',
                Sun_Hours: 8, Sun_Minutes: 30, Sun_Late_Hours: 0, Sun_OT_Hours: 1, Sun_Date: '2024-07-07',
                Weekly_Total_Additional: 0, Weekly_Total_Advance: 0, Weekly_Total_Deduction: 0
            };

            //update
            database.findOne.mockResolvedValue(mockPayroll);
            database.updateOne.mockRejectedValue(new Error('Database update failed'));

            await admin_empman_payroll_controller.post_update_payroll(req, res);

            //error 
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(JSON.stringify({ success: false, message: "Error updating payroll!" }));
        });
    });
});