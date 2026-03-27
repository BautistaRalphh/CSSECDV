const forgot_password_controller = require('../../controllers/forgot-password-controller.js');
const forgot_password = require('../../models/forgot_password_model.js');
const employee = require('../../models/employee_model.js');
const database = require('../../models/database.js');
const httpMocks = require('node-mocks-http');

jest.mock('../../models/forgot_password_model.js');
jest.mock('../../models/employee_model.js');
jest.mock('../../models/database.js');

describe('fogot-password-controller', () => {
    let req, res;

        beforeEach(() => {
            req = {
                body: {}
            };

            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
                json: jest.fn().mockImplementation(function (data) {
                    this._data = data;
                }),
                _getData: function () {
                    return this._data;
                }
            };
        });
    describe('post_add_forgot_password', () => {

        it('should add a new forgot password record', async () => {
            req.body = { email: 'test@example.com', cTime: '2024-08-01T00:00:00Z' };

            employee.findOne = jest.fn().mockResolvedValue({
                First_Name: 'John',
                Last_Name: 'Doe'
            });

            //assume the employee has no existing forgot_password record
            database.findOne.mockResolvedValue(null);
            forgot_password.countDocuments.mockResolvedValue(0);
            forgot_password.prototype.save.mockResolvedValue({});

            await forgot_password_controller.post_add_forgot_password(req, res);

            //verify that the correct data was fetched from the correct table
            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            expect(database.findOne).toHaveBeenCalledWith(forgot_password, { Email: 'test@example.com' });
            //verify that there is no existing forgot_password entry
            expect(forgot_password.countDocuments).toHaveBeenCalled();
            //verify that an entryw as created
            expect(forgot_password.prototype.save).toHaveBeenCalled();
            //verify that the success status code was sent
            expect(res.status).toHaveBeenCalledWith(200);
            //verify that a success message was sent
            expect(res._getData()).toEqual({ success: true, message: "Forgot Password Successful!" });

        });

        it('should return an error if the email does not exist', async () => {
             
            //assume the the email address does not exist in the database
            req.body = { email: 'test@example.com', cTime: '2024-08-01T00:00:00Z' };
            employee.findOne.mockResolvedValue(null); // No user found

            await forgot_password_controller.post_add_forgot_password(req, res);

            expect(employee.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            //verify that the error message was sent
            expect(res._getData()).toEqual({ success: false, message: "Email Does Not Exist." });
        });

        it('should return an error if forgot password record already exists', async () => {

            //assume that the employee already has an existing forgot_password entry
            req.body = { email: 'test@example.com', cTime: '2024-08-01T00:00:00Z' };
            employee.findOne.mockResolvedValue({
                First_Name: 'John',
                Last_Name: 'Doe'
            });

            database.findOne.mockResolvedValue({}); // Existing record

            await forgot_password_controller.post_add_forgot_password(req, res);

            //verify that an error message and the status code was sent
            expect(database.findOne).toHaveBeenCalledWith(forgot_password, { Email: 'test@example.com' });
            expect(res._getData()).toEqual({ success: false, message: "Forgot Password Already Exist." });
        });

        //failed
        it('should handle errors properly', async () => {

            //setup the employee data
            req.body = { email: 'test@example.com', cTime: '2024-08-01T00:00:00Z' };
            employee.findOne = jest.fn().mockResolvedValue({
                First_Name: 'John',
                Last_Name: 'Doe'
            });

            //assume the employee has no existing record
            database.findOne.mockResolvedValue(null); 

            //simulate an error
            forgot_password.countDocuments.mockRejectedValue(new Error('Database error')); // Simulate error

            await forgot_password_controller.post_add_forgot_password(req, res);

            //verify that the status and error message were sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res._getData()).toEqual({ success: false, message: "Forgot Password Controller Error!" });
        });
        
    });

    describe('post_delete_forgot_password', () => {

        it('should delete a forgot password record and update other records', async () => {

            //assume that the employee has an existing forgot_password entry
            req.body = { email: 'test@example.com' };
            const mockRecord = {
                Forgot_Password_Number: 1
            };

            forgot_password.findOne.mockResolvedValue(mockRecord);

            //delete and update the records
            forgot_password.deleteOne.mockResolvedValue({});
            forgot_password.updateMany.mockResolvedValue({});

            await forgot_password_controller.post_delete_forgot_password(req, res);

            //verify that the correct record was deleted and updated
            expect(forgot_password.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            expect(forgot_password.deleteOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            expect(forgot_password.updateMany).toHaveBeenCalledWith(
                { Forgot_Password_Number: { $gt: 1 } },
                { $inc: { Forgot_Password_Number: -1 } }
            );

            //verify that a success status and success message were sent
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res._getData()).toEqual({ success: true, message: "Forgot Password Record Deleted Successfully." });
        });

        it('should return an error if forgot password record is not found', async () => {
            //assume the employee has no existing record
            req.body = { email: 'test@example.com' };
            forgot_password.findOne.mockResolvedValue(null); // No record found

            await forgot_password_controller.post_delete_forgot_password(req, res);


            expect(forgot_password.findOne).toHaveBeenCalledWith({ Email: 'test@example.com' });
            //verify that status code and message were sent
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res._getData()).toEqual({ success: false, message: "Forgot Password Record Not Found." });
        });

        //failed
        it('should handle errors gracefully', async () => {
            req.body = { email: 'test@example.com' };
            forgot_password.findOne.mockResolvedValue({
                Forgot_Password_Number: 1
            });

            forgot_password.deleteOne.mockResolvedValue({});
            // Simulate error
            forgot_password.updateMany.mockRejectedValue(new Error('Database error')); 

            await forgot_password_controller.post_delete_forgot_password(req, res);

            //verify that the status code and error message were sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res._getData()).toBe('Internal Server Error!');
        });
    });
});