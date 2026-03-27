const employee = require('../../models/employee_model.js');
const database = require('../../models/database.js');
const admin_empman_emprecs_controller = require('../../controllers/admin-empman-emprecs-controller.js');

jest.mock('../../models/database.js');
jest.mock('../../models/employee_model.js');

describe('admin_empman_emprecs_controller', () => {
    let req, res;
    describe('get_emprecs', () => {

        beforeEach(() => {
            req = {};
            res = {
                render: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
        });

        it('should render the admin-empman-emprecs view with sorted employee emails', async () => {
            //Arrange the conditions
            const mockEmployees = [
                { Email: 'c@example.com', Employee_Type: 'Employee' },
                { Email: 'a@example.com', Employee_Type: 'Work From Home' },
                { Email: 'b@example.com', Employee_Type: 'Admin'}
            ];

            database.findMany.mockResolvedValue(mockEmployees);

            await admin_empman_emprecs_controller.get_emprecs(req, res);

            //expected response
            const sorted = [
                { Email: 'a@example.com', Employee_Type: 'Work From Home' },
                { Email: 'b@example.com', Employee_Type: 'Admin' },
                { Email: 'c@example.com', Employee_Type: 'Employee' }
            ]

            //render the page with sorted emails
            expect(res.render).toHaveBeenCalledWith('admin-empman-emprecs', { emp_emails: sorted });

            //check that the query has been made in the right model and the query should match any of the conditions specified 
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [
                    { Employee_Type: 'Employee' },
                    { Employee_Type: 'Work From Home' },
                    { Employee_Type: 'Admin' }
                ]
            });


        })

        //failed 
        it('should handle errors gracefully', async () => {            
            //simulate the error
            database.findMany.mockRejectedValue(new Error('Database Error'));

            await admin_empman_emprecs_controller.get_emprecs(req, res);

            //assert that the 500 status code was sent
            expect(res.status).toHaveBeenCalledWith(500);

            //assert that the error message was sent
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        })

    });
    
    describe('post_specific_emprecs', () => {

        //initialize req and res that will be used for each test case
        beforeEach(() => {
            req = { body: { email: 'a@example.com' } };
            res = {
                render: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
        });

        it('should render the admin-empman-emprecs view with specific employee details', async () => {
            
            const mockEmployees = [
                { Email: 'c@example.com', Employee_Type: 'Employee' },
                { Email: 'a@example.com', Employee_Type: 'Work From Home' },
                { Email: 'b@example.com', Employee_Type: 'Admin' }
            ];

            //sample pecific employee data
            const mockEmployeeDetails = { Email: 'a@example.com', Employee_Type: 'Work From Home', Name: 'Alice' };

            database.findMany.mockResolvedValue(mockEmployees);
            employee.findOne.mockResolvedValue(mockEmployeeDetails);

            await admin_empman_emprecs_controller.post_specific_emprecs(req, res);

            //the correct table [employee] should be used
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [
                    { Employee_Type: 'Employee' },
                    { Employee_Type: 'Work From Home' },
                    { Employee_Type: 'Admin' }
                ]
            });

            //expected sorted employee emails
            const sortedEmails = [
                { Email: 'a@example.com', Employee_Type: 'Work From Home' },
                { Email: 'b@example.com', Employee_Type: 'Admin' },
                { Email: 'c@example.com', Employee_Type: 'Employee' }
            ];

            //the correct employee details should be returned
            expect(employee.findOne).toHaveBeenCalledWith({ Email: req.body.email });

            //the page should display sorted employee emails
            expect(res.render).toHaveBeenCalledWith('admin-empman-emprecs', { emp_emails: sortedEmails, emp_sum: mockEmployeeDetails });
        });

        it('should handle errors gracefully', async () => {

            //method would return an empty array 
            database.findMany.mockResolvedValue([]);

            //simulate error
            employee.findOne.mockRejectedValue(new Error('Database Error'));

            await admin_empman_emprecs_controller.post_specific_emprecs(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        });
    });
});