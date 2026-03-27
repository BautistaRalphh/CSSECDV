const admin_notifs_controller = require('../../controllers/admin-notifs-controller');
const database = require('../../models/database');
const forgot_password = require('../../models/forgot_password_model');
const httpMocks = require('node-mocks-http');

jest.mock('../../models/database');
jest.mock('../../models/forgot_password_model');

describe('admin-notifs-controller', () => {

    let req, res;

    //initialize req and res
    beforeEach(() => {
        
        req = {};
        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

    });

    describe('get_admin_notifs', () => {
        it('should render the admin-notifs page', () => {

            admin_notifs_controller.get_admin_notifs(req, res);

            //verify that the correct page has been rendered
            expect(res.render).toHaveBeenCalledWith('admin-notifs');
        });
    });

    describe('get_forgot_password', () => {
        
        it('should render the admin-notifs page with employees with forgotten passwords', async () => {

            //sample list of employees with forgotten password
            const mockData = [
                { Forgot_Password_Number: 2, name: 'John Doe' },
                { Forgot_Password_Number: 1, name: 'Jane Smith' }
            ];

            database.findMany.mockResolvedValue(mockData);

            await admin_notifs_controller.get_forgot_password(req, res);

            //verify the query
            expect(database.findMany).toHaveBeenCalledWith(forgot_password);

            //verify that the page has been rendered with the correct data
            expect(res.render).toHaveBeenCalledWith('admin-notifs', { emp_forgot_password: mockData });
        });

        it('should handle errors gracefully', async () => {

            //simulate the error
            database.findMany.mockRejectedValue(new Error('Database Error'));

            await admin_notifs_controller.get_forgot_password(req, res);

            //error status and message
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
        })
    });

});
