const httpMocks = require('node-mocks-http');
const register_controller = require('../../controllers/register-controller.js');
const employee = require('../../models/employee_model.js');
const payroll = require('../../models/payroll_model.js');
const { hashPassword } = require('../../utils/password');

jest.mock('../../models/employee_model.js');
jest.mock('../../models/payroll_model.js');
jest.mock('../../utils/password');

describe('register-controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Elm Street',
                contactNumber: '1234567890',
                email: 'john.doe@example.com',
                password: 'password123',
                employee_type: 'Employee'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            render: jest.fn()
        };
    });

    describe('get_register', () => {

        it('should render the register page', () => {

            register_controller.get_register(req, res);
            //verify that the correct page was rendered
            expect(res.render).toHaveBeenCalledWith('register', { isAdmin: false });
        });
    });

    describe('post_register', () => {

        it('should register a new employee and create initial payroll records', async () => {

            //assume there is no existing user
            employee.findOne.mockResolvedValue(null); 
            hashPassword.mockResolvedValue('hashed-password');

            //save the new data
            employee.prototype.save.mockResolvedValue();
            payroll.prototype.save.mockResolvedValue(); 

            await register_controller.post_register(req, res);

            // Verify employee and payroll creation
            expect(employee.findOne).toHaveBeenCalledWith({ Email: req.body.email });
            expect(hashPassword).toHaveBeenCalledWith(req.body.password);
            expect(employee.prototype.save).toHaveBeenCalled();
            expect(payroll.prototype.save).toHaveBeenCalledTimes(3); //one for each week

            // Verify response
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Registration Successful!" });
        });

        it('should return an error if the email already exists', async () => {

            //user already exists
            employee.findOne.mockResolvedValue({}); 

            await register_controller.post_register(req, res);

            // Verify error response 
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Email Already Exists!" });
        });

        it('should return an error if password is missing', async () => {
            req.body = {
                email: 'test@example.com',
                password: '', //missing pw
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Street',
                contactNumber: '1234567890',
                employee_type: 'Employee'
            };

            //assume the employee does not exist
            employee.findOne.mockResolvedValue(null);

            await register_controller.post_register(req, res);

            //verify status code and message
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing Password!" });
        });

        it('should handle errors during employee save', async () => {

            //assume the user does not yet exist
            employee.findOne.mockResolvedValue(null); 
            hashPassword.mockResolvedValue('hashed-password');
            //simulate error
            employee.prototype.save.mockRejectedValue(new Error('Database error')); // Simulate save failure

            await register_controller.post_register(req, res);

            // Verify status code and message
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Registration Controller Error!' , success: false});
        });
    });
});
