const update_payroll_controller = require('../../controllers/update-payroll-controller.js');
const database = require('../../models/database.js');
const payroll = require('../../models/payroll_model.js');
const employee = require('../../models/employee_model.js');
const { HttpStatusCode } = require('axios');
const { json } = require('body-parser');

jest.mock('../../models/database.js');
jest.mock('../../models/payroll_model.js');
jest.mock('../../models/employee_model.js');

describe('update-payroll-controller', () => {
    let req, res; 

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            render: jest.fn()
        };
    });

    describe('post_update_employee_payroll', () => {
        it('should update payroll records correctly', async () => {
        
            //set up mock data
            const mockEmployeeData = [
                { Email: 'employee1@example.com', Employee_Type: 'Employee' },
                { Email: 'employee2@example.com', Employee_Type: 'Work From Home' }
            ];

            const mockWeek0Data = {
                Mon_Hours: 0,
                Mon_Minutes: 0,
                // Other fields with default values...
                Weekly_Hourly_Rate: 10
            };

            const mockWeek1Data = {
                Mon_Hours: 8,
                Mon_Minutes: 30,
                // Other fields with week 1 values...
                Weekly_Hourly_Rate: 15
            };

            database.findMany.mockResolvedValue(mockEmployeeData);
            database.findOne.mockImplementation((model, query) => {

                if (query.Week === 0) {
                    return Promise.resolve(mockWeek0Data);
                } else if (query.Week === 1) {
                    return Promise.resolve(mockWeek1Data);
                }

                return Promise.resolve(null);
            });

            database.updateOne.mockResolvedValue(true);

            await update_payroll_controller.post_update_employee_payroll(req, res);

            //verify that the correct table [employee] is being used
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [{ Employee_Type: "Employee" },
                      { Employee_Type: "Work From Home" }]
            });

            //verify that the calls were made 
            expect(database.findOne).toHaveBeenCalledTimes(4); 
            expect(database.updateOne).toHaveBeenCalledTimes(8); 

            //update the payrolls for each week
            expect(database.updateOne).toHaveBeenCalledWith(payroll, { Email: 'employee1@example.com', Week: 2 }, expect.any(Object));
            expect(database.updateOne).toHaveBeenCalledWith(payroll, { Email: 'employee1@example.com', Week: 1 }, expect.any(Object));
            expect(database.updateOne).toHaveBeenCalledWith(payroll, { Email: 'employee1@example.com', Week: 0 }, expect.any(Object));
            
        });
    })
});