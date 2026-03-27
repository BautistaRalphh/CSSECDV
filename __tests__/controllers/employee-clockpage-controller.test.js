const httpMocks = require('node-mocks-http');
const employee_clockpage_controller = require('../../controllers/employee-clockpage-controller.js');
const database = require('../../models/database.js');
const employee = require('../../models/employee_model.js');
const payroll = require('../../models/payroll_model.js');

jest.mock('../../models/database.js');


describe('employee_clockpage_controller', () => {

    let req, res;

    beforeEach(() => {
        req = {
            session: {
                Email: 'test@example.com',
                Employee_type: 'Employee'
            }
        };

        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
    });

    describe('get_employee_clockpage', () => {

        it('should render the employee-clockpage with email and employee type', () => {
            employee_clockpage_controller.get_employee_clockpage(req, res);

            //verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('employee-clockpage', {
                email: req.session.Email,
                emp_type: req.session.Employee_type
            });
        });
    });

    describe('get_wfh_clockpage', () => {
        it('should render the work-from-home-clockpage with email and employee type', () => {
            employee_clockpage_controller.get_wfh_clockpage(req, res);

            expect(res.render).toHaveBeenCalledWith('work-from-home-clockpage', {
                email: req.session.Email,
                emp_type: req.session.Employee_type
            });
        });
    });

    describe('get_employee_time_in_status', () => {
        
        it('should return the time-in status for the current employee', async () => {

            //assume the employee has timed in
            const mockEmployee = { IsTimedIn: true };
            database.findOne.mockResolvedValue(mockEmployee);

            await employee_clockpage_controller.get_employee_time_in_status(req, res);

            //verify that the correct employee data was returned
            expect(database.findOne).toHaveBeenCalledWith(expect.anything(), { Email: req.session.Email });
            //verify that the correct time-in status of the employee was returned
            expect(res.json).toHaveBeenCalledWith({ time_in_status: mockEmployee.IsTimedIn });
        });

        it('should handle errors gracefully', async () => {

            //simulate error
            database.findOne.mockRejectedValue(new Error('Database Error'));

            await employee_clockpage_controller.get_employee_time_in_status(req, res);

            //send error message and status code
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Internal Server Error!");
        });
    });

    describe('post_employee_time_in', () => {
        it('should update the employee time-in status and render the employee clockpage', async () => {
            //initialize the req [assume test employee is timing in]
            req = {
                session: {
                    Email: 'test@example.com',
                    Employee_type: 'Employee'
                },
                body: {
                    Time_In: '09:00',
                    TI_weekdayIndex: 1,
                    Time_In_Date: '2024-07-30'
                }
            };

            database.updateOne.mockResolvedValue({});
            database.findOne.mockResolvedValue({
                Mon_Date: '2024-07-30',
                Time_In_Weekday_Index: 1,
                Mon_Total_Pay: 160,
                Weekly_Total_Pay: 160
            });

            await employee_clockpage_controller.post_employee_time_in(req, res);

            //verify that the update was done in the correct table [employee] and that the employee time in status has been updated
            expect(database.updateOne).toHaveBeenNthCalledWith(1, employee, { Email: req.session.Email }, { $set: { IsTimedIn: true } });
             //verify that the payroll of the correct employee was also updated
            expect(database.updateOne).toHaveBeenCalledWith(2, payroll, { Email: req.session.Email, Week: 0 }, {
                $set: {
                    Mon_Date: '2024-07-30',
                    Mon_Time_In: '09:00',
                    Time_In_Weekday_Index: 1,
                    Mon_Total_Pay: 160,
                    Weekly_Total_Pay: 160
                }
            });


            //verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith("employee-clockpage", {
                email: req.session.Email,
                emp_type: req.session.Employee_type
            });
        })
    })

    describe('post_employee_time_out', () => {

        beforeEach(() => {
            req = {
                body: {
                    TO_hour: '17',
                    TO_minute: '00',
                    TO_weekdayIndex: 5
                },
                session: {
                    Email: 'a@example.com',
                    Employee_type: 'Employee'
                }
            };
        })
        //failed
        it('should handle employee time out and update payroll', async () => {
            
            //mock payroll data
            const mockPayroll = {
                Mon_Time_In: '08:00',
                Weekly_Hourly_Rate: 100,
                Time_In_Weekday_Index: 1,
                Some_Date_Field: '2024-08-01'
            };

            //assume the employee has already timed in
            const mockEmployee = { IsTimedIn: true };

            //use the correct models
            database.findOne.mockImplementation((model, query) => {
                if (model === payroll) return mockPayroll;
                if (model === employee) return mockEmployee;
            });

            database.updateOne.mockResolvedValue({});

            await employee_clockpage_controller.post_employee_time_out(req, res);

            //verify that the payroll was updated
            expect(database.findOne).toHaveBeenCalledWith(payroll, { Email: req.session.Email, Week: 0 });
            //verify that the employee's status was updated
            expect(database.findOne).toHaveBeenCalledWith(employee, { Email: req.session.Email });
            expect(database.updateOne).toHaveBeenCalledWith(employee, { Email: req.session.Email }, { IsTimedIn: false });
            //verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('employee-clockpage', { email: req.session.Email, emp_type: req.session.Employee_type });
        });

        //failed
        it('should handle errors gracefully', async () => {
            //simulate an error
            database.findOne.mockRejectedValue(new Error('Database Error'));
            
            await employee_clockpage_controller.post_employee_time_out(req, res);

            //verify that the error status code and error message was sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        });

        it('should correctly identify and handle holidays', async () => { 
            
            //mock payroll data
            const mockPayroll = {
                Mon_Time_In: '08:00',
                Weekly_Hourly_Rate: 100,
                Time_In_Weekday_Index: 1,
                
            };

            //assume the employee was timed in
            const mockEmployee = { IsTimedIn: true };

            database.findOne.mockImplementation((model, query) => {
                if (model === payroll) return mockPayroll;
                if (model === employee) return mockEmployee;
            });

            await employee_clockpage_controller.post_employee_time_out(req, res);

            //verify that the payroll was updated
            expect(database.findOne).toHaveBeenCalledWith(payroll, { Email: req.session.Email, Week: 0 });
            //verify that the employee's status was updated
            expect(database.findOne).toHaveBeenCalledWith(employee, { Email: req.session.Email });
            expect(database.updateOne).toHaveBeenCalledWith(employee, { Email: req.session.Email }, { IsTimedIn: false });
            //verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('employee-clockpage', { email: req.session.Email, emp_type: req.session.Employee_type });
        });

    });
});