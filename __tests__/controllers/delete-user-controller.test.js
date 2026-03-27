const delete_user_controller = require('../../controllers/delete-user-controller.js'); 
const httpMocks = require('node-mocks-http');
const database = require('../../models/database.js');
const employee = require('../../models/employee_model.js');
const forgot_password = require('../../models/forgot_password_model.js');
const { json } = require('body-parser');

jest.mock('../../models/database.js');
jest.mock('../../models/employee_model.js');
jest.mock('../../models/forgot_password_model.js');

describe('delete-user-controller', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
            json: jest.fn(),
            send: jest.fn()
        };
    });

    describe('get_delete_user_page', () => {
        it('should render the delete-user page', () => {
            delete_user_controller.get_delete_user_page(req, res);

            //render the page 
            expect(res.render).toHaveBeenCalledWith('delete-user');
        });
    });

    describe('get_delete_user', () => {
        
        it('should fetch employee details and render the delete-user page', async () => {
            //set up sample employees
            const mockEmployees = [
                { Email: 'a@example.com', Employee_Type: 'Employee' },
                { Email: 'b@example.com', Employee_Type: 'Admin' }
            ]

            database.findMany.mockResolvedValue(mockEmployees);

            await delete_user_controller.get_delete_user(req, res);

            //verify that the operation has been performed in the correct table [employee]
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [
                    { Employee_Type: "Employee" },
                    { Employee_Type: "Work From Home" },
                    { Employee_Type: "Admin" }
                ]
            });

            //verify that the page has been rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('delete-user', { emp_emails: mockEmployees });
        });

        //failed
        it('should handle errors gracefully', async () => {

            //simulate an error
            database.findMany.mockRejectedValue(new Error('Database Error'));

            await delete_user_controller.get_delete_user(req, res);

            //error status and message
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        });

    });

    describe('post_display_info', () => {
        it('should fetch and display employee details based on the email', async () => {
            req = { body: { email: 'a@example.com' } };

            //set up sample employees
            const mockEmployees = [
                { Email: 'a@example.com', Employee_Type: 'Employee' },
                { Email: 'b@example.com', Employee_Type: 'Admin' }
            ];

            //set up sample employee data 
            const mockEmployee = { Email: 'a@example.com', Employee_Type: 'Employee' };

            //query for list of employees
            database.findMany.mockResolvedValue(mockEmployees);

            //query for the specific employee
            employee.findOne.mockResolvedValue(mockEmployee);

            await delete_user_controller.post_display_info(req, res);

            //ensure that correct table was used [employee]
            expect(database.findMany).toHaveBeenCalledWith(employee, {
                $or: [
                    { Employee_Type: "Employee" },
                    { Employee_Type: "Work From Home" },
                    { Employee_Type: "Admin" }
                ]
            });

            //verify that the data corresponding to the email was returned
            expect(employee.findOne).toHaveBeenCalledWith({ Email: req.body.email });
            //render the page with the correct data
            expect(res.render).toHaveBeenCalledWith('delete-user', { emp_sum: mockEmployee, emp_emails: mockEmployees });
        });

        it('should handle error gracefully', async () => {

            const req = { body: { email: 'a@example.com' } };

            //no list of employees returned
            database.findMany.mockResolvedValue([]);

            //simulate database error
            employee.findOne.mockRejectedValue(new Error('Database Error'));

            await delete_user_controller.post_display_info(req, res);

            //error status code and message 
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Internal Server Error!");

        });
    });

    describe('post_delete_user', () => {

        beforeEach(() => {
            req = { body: { email: 'a@example.com' } };
        })
        it('should delete the user and associated forgot password documents if present', async () => {

            //assume the user and forgot password entry exist
            const userExists = { Email: 'a@example.com' };
            const forgotPasswordExists = { Forgot_Password_Number: 1 };

            //perform the queries
            employee.findOne.mockResolvedValue(userExists);
            forgot_password.findOne.mockResolvedValue(forgotPasswordExists);

            //perform deletion and update
            forgot_password.deleteOne.mockResolvedValue({});
            forgot_password.updateMany.mockResolvedValue({});

            employee.deleteOne.mockResolvedValue({});

            await delete_user_controller.post_delete_user(req, res);

            //verify that the queries have been performed 
            expect(employee.findOne).toHaveBeenCalledWith({ Email: req.body.email });
            expect(forgot_password.findOne).toHaveBeenCalledWith({ Email: req.body.email });
            //verify that the delete and update operations have been performed
            expect(forgot_password.deleteOne).toHaveBeenCalledWith({ Email: req.body.email });
            expect(forgot_password.updateMany).toHaveBeenCalledWith({ Forgot_Password_Number: { $gt: forgotPasswordExists.Forgot_Password_Number } }, { $inc: { Forgot_Password_Number: -1 } });
            expect(employee.deleteOne).toHaveBeenCalledWith(userExists);
            //verify that a success message has been sent
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Deletion successful!" });

        });

        it('should delete the user even if ther eis not forgot_password document', async () => {

            //assume the user exists without forgot_password entry
            const userExists = { Email: 'a@example.com' };

            employee.findOne.mockResolvedValue(userExists);
            forgot_password.findOne.mockResolvedValue(null);

            //delete
            employee.deleteOne.mockResolvedValue({});

            await delete_user_controller.post_delete_user(req, res);

            //verify that the query returned the correct data
            expect(employee.findOne).toHaveBeenCalledWith({ Email: req.body.email });
            expect(forgot_password.findOne).toHaveBeenCalledWith({ Email: req.body.email });
            //verify that delete has been done
            expect(employee.deleteOne).toHaveBeenCalledWith(userExists);
            //send success message 
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Deletion successful!" });
            
        });

        it('should handle deletion errors gracefully', async () => {
            //assume the user exists
            const userExists = { Email: 'a@example.com' };

            //query for the employee and forgot_password entry
            employee.findOne.mockResolvedValue(userExists);
            forgot_password.findOne.mockResolvedValue({ Forgot_Password_Number: 1 });

            //delete and update
            forgot_password.deleteOne.mockResolvedValue({});
            forgot_password.updateMany.mockResolvedValue({});

            //simulate error 
            employee.deleteOne.mockRejectedValue(new Error('Database error'));

            await delete_user_controller.post_delete_user(req, res);

            //error message and status
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Internal Server Error' });
        });

        it('handle non-existent users', async () => {
            //set up non existent user
            req = { body: { email: 'nonexistent@example.com' } };

            employee.findOne.mockResolvedValue(null);

            await delete_user_controller.post_delete_user(req, res);

            //error message and status code
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "There are no Existing Users!" });
        });
    });
});