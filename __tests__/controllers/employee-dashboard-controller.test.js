const employee_dashboard_controller = require('../../controllers/employee-dashboard-controller.js');
const payroll = require('../../models/payroll_model.js');
const employee = require('../../models/employee_model.js');
const database = require('../../models/database.js');
const httpMocks = require('node-mocks-http');

jest.mock('../../models/database.js');
jest.mock('../../models/employee_model.js');
jest.mock('../../models/payroll_model.js');

describe('employee-dashboard-controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            session: {
                Email: 'employee@example.com',
                Employee_type: 'Employee',
                ETI_weekdayIndex: 2
            },
            body: {
                week: 1
            }
        };
        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    describe('get_employee_dashboard', () => {

        it('should render employee dashboard with employee details', async () => {
            //set up mock employee
            const mockEmployee = { Name: 'John Doe', Position: 'Employee' };

            database.findOne.mockResolvedValueOnce(mockEmployee);

            await employee_dashboard_controller.get_employee_dashboard(req, res);

            //verify that the correct employee details was returned
            expect(database.findOne).toHaveBeenCalledWith(employee, { Email: req.session.Email });

            //verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('employee-dashboard', {
                email: req.session.Email,
                emp_type: req.session.Employee_type,
                ETI_weekdayIndex: req.session.ETI_weekdayIndex,
                emp_rec: mockEmployee
            });
        });

        it('should handle errors gracefully', async () => {

            //simulate database error
            database.findOne.mockRejectedValueOnce(new Error('Database Error'));

            await employee_dashboard_controller.get_employee_dashboard(req, res);

            //verify that error messages and code status was sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Internal Server Error!");
        });
    });

    describe('get_enployee_details', () => {

        it('should render employee dashboard with detailed employee information', async () => {
            //set up mock payroll and employee records
            const mockPayroll = {
                Weekly_Hourly_Rate: 20,
                Sun_Hours: 8, Sun_Minutes: 30, Sun_Total_Pay: 200,
                Mon_Hours: 8, Mon_Minutes: 30, Mon_Total_Pay: 200,
                Tue_Hours: 8, Tue_Minutes: 30, Tue_Total_Pay: 200,
                Wed_Hours: 8, Wed_Minutes: 30, Wed_Total_Pay: 200,
                Thu_Hours: 8, Thu_Minutes: 30, Thu_Total_Pay: 200,
                Fri_Hours: 8, Fri_Minutes: 30, Fri_Total_Pay: 200,
                Sat_Hours: 8, Sat_Minutes: 30, Sat_Total_Pay: 200,
                Weekly_Total_Pay: 1400
            };
            const mockEmployee = { Name: 'John Doe', Position: 'Employee' };

            // Mock database.findOne to return the mock payroll and employee records
            database.findOne.mockImplementation((model, query) => {
                if (model === payroll) return Promise.resolve(mockPayroll);
                if (model === employee) return Promise.resolve(mockEmployee);
            });

            await employee_dashboard_controller.get_employee_details(req, res);

            // Verify that the correct employee and payroll data were returned
            expect(database.findOne).toHaveBeenCalledWith(payroll, { Email: req.session.Email, Week: req.body.week });
            expect(database.findOne).toHaveBeenCalledWith(employee, { Email: req.session.Email });

            // Verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('employee-dashboard', {
                email: req.session.Email,
                emp_type: req.session.Employee_type,
                ETI_weekdayIndex: req.session.ETI_weekdayIndex,
                emp_det: mockPayroll,
                emp_rec: mockEmployee,
                Total_Hour_Rate: expect.any(Array),
                Total_Minute_Rate: expect.any(Array)
            });
        });

        it('should handle errors gracefully', async () => {

            //simulate error
            database.findOne.mockRejectedValueOnce(new Error('Database Error'));

            await employee_dashboard_controller.get_employee_details(req, res);

            // verify that error message and status were sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Internal Server Error!");
        });
    });
});