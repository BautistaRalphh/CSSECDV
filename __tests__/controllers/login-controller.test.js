const login_controller = require('../../controllers/login-controller');
const employee = require('../../models/employee_model');
const { verifyPassword, hashPassword } = require('../../utils/password');
const { logAuditEvent } = require('../../utils/audit-log');

jest.mock('../../models/employee_model');
jest.mock('../../utils/password');
jest.mock('../../utils/audit-log');

describe('login-controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'password123'
            },
            session: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            render: jest.fn(),
            json: jest.fn().mockImplementation(function (data) {
                    this._data = data;
                }),
            _getData: function () {
                return this._data;
            }
        };
    });

    describe('post_login', () => {

        it('should log in successfully for an Employee type', async () => {

            //set up mock employee
            employee.findOne.mockResolvedValue({
                Email: 'test@example.com',
                Password: 'hashed-password',
                Employee_Type: 'Employee'
            });
            verifyPassword.mockResolvedValue({ isValid: true, needsUpgrade: false });

            await login_controller.post_login(req, res);

            //verify that the correct data was fetched
            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            expect(req.session.Email).toBe('test@example.com');
            expect(req.session.Employee_Type).toBe('Employee');
            expect(logAuditEvent).toHaveBeenCalledWith({
                email: 'test@example.com',
                employeeType: 'Employee',
                action: 'LOGIN'
            });
            //verify that the status and a success message was sent
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res._getData()).toEqual({ success: true, type: "Employee", message: "Login Successful!" });
        });

        it('should log in successfully for a Work From Home type', async () => {
            
            //set up wfh data
            employee.findOne.mockResolvedValue({
                Email: 'test@example.com',
                Password: 'hashed-password',
                Employee_Type: 'Work From Home'
            });
            verifyPassword.mockResolvedValue({ isValid: true, needsUpgrade: false });

            await login_controller.post_login(req, res);

            //verify that the correct data was fetched
            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            expect(req.session.Email).toBe('test@example.com');
            expect(req.session.Employee_Type).toBe('Work From Home');
            //verify success status code and message
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res._getData()).toEqual({ success: true, type: "Work From Home", message: "Login Successful!" });
        });

        it('should log in successfully for an Admin type', async () => {
            //set up admin data
            employee.findOne.mockResolvedValue({
                Email: 'test@example.com',
                Password: 'hashed-password',
                Employee_Type: 'Admin'
            });
            verifyPassword.mockResolvedValue({ isValid: true, needsUpgrade: false });

            await login_controller.post_login(req, res);

            //verify that the correct data was fetched
            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            expect(req.session.Email).toBe('test@example.com');
            expect(req.session.Employee_Type).toBe('Admin');
            //verify status code and message
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res._getData()).toEqual({ success: true, type: "Admin", message: "Login Successful!" });
        });

        it('should return an error if the email does not exist', async () => {

            //assume the email address does not exist
            employee.findOne.mockResolvedValue(null);

            await login_controller.post_login(req, res);

            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            //verify status code and message
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res._getData()).toEqual({ message: "Incorrect Credentials!" });
        });

        it('should return an error if the password is incorrect', async () => {

            //assume the user entered a wrong password
            employee.findOne.mockResolvedValue({
                Email: 'test@example.com',
                Password: 'hashed-password',
                Employee_Type: 'Employee'
            });
            verifyPassword.mockResolvedValue({ isValid: false, needsUpgrade: false });

            await login_controller.post_login(req, res);

            //verify that the entered password did not match
            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            //verify status code and error message
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res._getData()).toEqual({ message: "Incorrect Credentials!" });
        });

        it('should handle errors properly', async () => {

            //simulate error
            employee.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

            await login_controller.post_login(req, res);

            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            //verify status code and message
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res._getData()).toEqual({ success: false, message: "Login Controller Error!" });
        });

        it('should upgrade a legacy plaintext password after successful login', async () => {
            employee.findOne.mockResolvedValue({
                Email: 'test@example.com',
                Password: 'password123',
                Employee_Type: 'Employee'
            });
            verifyPassword.mockResolvedValue({ isValid: true, needsUpgrade: true });
            hashPassword.mockResolvedValue('rehashed-password');
            employee.updateOne.mockResolvedValue({});

            await login_controller.post_login(req, res);

            expect(hashPassword).toHaveBeenCalledWith('password123');
            expect(employee.updateOne).toHaveBeenCalledWith(
                { Email: 'test@example.com' },
                { $set: { Password: 'rehashed-password' } }
            );
        });


    });
    
});
