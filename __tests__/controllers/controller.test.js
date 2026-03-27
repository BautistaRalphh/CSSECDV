const controller = require('../../controllers/controller.js'); 

describe('controller', () => {

    let req, res;

    //initialize req and res
    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            render: jest.fn()
        };
    });

    describe('getFavicon', () => {

        it('should respond with status 204', () => {

            controller.getFavicon(req, res);

            //return expected status code 
            expect(res.status).toHaveBeenCalledWith(204);
            //verify that the method was called once
            expect(res.status).toHaveBeenCalledTimes(1);
        });
    });

    describe('get_index', () => {

        it('should render the log-in page view', () => {
            controller.get_index(req, res);

            //render the login page only once
            expect(res.render).toHaveBeenCalledWith('login-page');
            expect(res.render).toHaveBeenCalledTimes(1);
        })
    })

})

