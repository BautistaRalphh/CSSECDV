const payroll = require('../../models/payroll_model.js');
const httpMocks = require('node-mocks-http');
const admin_dash_logs_controller = require('../../controllers/admin-dash-logs-controller.js');
const { query } = require('express');
const database = require('../../models/database.js');

jest.mock('../../models/database.js');

describe('admin_dash_logs_controller', () => {

    let req, res;

    //initialize req and res that will be used in each test case
    beforeEach(() => {
        req = {
            query: {}
        };

        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });
    describe('get_admin_dash_logs', () => {

        //render admin dash view
        it('should render the admin-dash-logs view', () => {

            admin_dash_logs_controller.get_admin_dash_logs(req, res);

            //assert that the page has been rendered
            expect(res.render).toHaveBeenCalledWith('admin-dash-logs');
        });
    });

//generate employee summary
    describe('get_employee_summary', () => {

        //valid test
        it('should render the admin-dash-logs view with employee data', async () => { 

            //arrange the conditions
            const fakeData = [{
                name: 'John Doe',
                Mon_Date: '2024-07-30'
            }];

            //simulate the request
            req.query.s_date = '2024-07-30';
            req.query.d_week = 'Monday'; 

            database.findMany.mockResolvedValue(fakeData);

            await admin_dash_logs_controller.get_employee_summary(req, res);

            expect(database.findMany).toHaveBeenCalledWith(payroll, {
                $or: [
                    { Mon_Date: req.query.s_date },
                    { Tue_Date: req.query.s_date },
                    { Wed_Date: req.query.s_date },
                    { Thu_Date: req.query.s_date },
                    { Fri_Date: req.query.s_date },
                    { Sat_Date: req.query.s_date },
                    { Sun_Date: req.query.s_date }
                ]
            });

            expect(res.render).toHaveBeenCalledWith('admin-dash-logs', { emp_sum: fakeData, d_week: req.query.d_week });

        });
            
        //error handling
        it('should handle errors gracefully and send a 500 status code', async () => {
           
            req.query.s_date = '2024-07-30';
            req.query.d_week = 'Monday';

            //simulate the error
            database.findMany.mockRejectedValue(new Error('Database Error'));

            //call the method
            await admin_dash_logs_controller.get_employee_summary(req, res);

            //assert that the 500 status call was sent upon the error
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');

        });


        //added this
        it('should handle different query dates correctly', async () => {

            //check for data in each date 
            const dates = ['2024-07-23', '2024-07-24', '2024-07-25'];
            const fakeData = { '2024-07-23': [], '2024-07-24': [], '2024-07-25': [] };

            //iterate over the sample dates 
            for (const date of dates) {
                req.query.s_date = date;
                req.query.d_week = 'Wednesday';

                //simulate the query
                database.findMany.mockResolvedValue(fakeData[date]);

                await admin_dash_logs_controller.get_employee_summary(req, res);

                //the query should be performed in the correct table [payroll]
                expect(database.findMany).toHaveBeenCalledWith(payroll, {
                    $or: [
                        { Mon_Date: date },
                        { Tue_Date: date },
                        { Wed_Date: date },
                        { Thu_Date: date },
                        { Fri_Date: date },
                        { Sat_Date: date },
                        { Sun_Date: date }
                    ]
                });

                //render the page with the correct data
                expect(res.render).toHaveBeenCalledWith('admin-dash-logs', { emp_sum: fakeData[date], d_week: req.query.d_week });
            }
        });
    });
});






