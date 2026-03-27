const httpMocks = require('node-mocks-http');
const otp_controller = require('../../controllers/otp-controller.js');
const Current_otp = require('../../models/otp_model.js');

jest.mock('../../models/otp_model.js');

describe('otp-controller', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        //mock the methods
        jest.spyOn(Current_otp, 'findOneAndDelete').mockResolvedValue({});
        jest.spyOn(Current_otp.prototype, 'save').mockResolvedValue();
        jest.spyOn(Current_otp, 'findOne').mockResolvedValue(null);

    });

    describe('post_generate_otp', () => {

        //failed
        it('should generate and store a new OTP', async () => {
            await otp_controller.post_generate_otp(req, res);
            
            //verify that a new OTP was generated and saved
            expect(Current_otp.findOneAndDelete).toHaveBeenCalled();
            expect(Current_otp.prototype.save).toHaveBeenCalled();
            
            //verify the status code and message
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'otp generated and stored successfully' });
        });

    });

    describe('post_verify_otp', () => {
        //failed
        it('should return the correct OTP', async () => {
            
            //set up mock OTP value
            const mockOtp = { current_otp: 1234 };
            Current_otp.findOne.mockResolvedValue(mockOtp);

            await otp_controller.post_verify_otp(req, res);

            //verify that the newly created OTP was fetched
            expect(Current_otp.findOne).toHaveBeenCalled();
            //verify that the response was sent with the correct value [OTP was verified]
            expect(res.json).toHaveBeenCalledWith({ correctNumber: mockOtp.current_otp });
        });

        //failed
        it('should return a 404 if no OTP is found', async () => {

            //assume no OTP was found
            Current_otp.findOne.mockResolvedValue(null);

            await otp_controller.post_verify_otp(req, res);

            //verify status code and message
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'No otp generated yet' });
        });
    });
   
});