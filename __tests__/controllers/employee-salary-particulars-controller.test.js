const employee_salary_particulars_controllers = require('../../controllers/employee-salary-particulars-controller.js');
const employee = require('../../models/employee_model.js');
const database = require('../../models/database.js');
const httpMocks = require('node-mocks-http');

const PDFDocument = require('pdfkit');
const fs = require('fs');

jest.mock('../../models/database.js');
jest.mock('pdfkit');
jest.mock('fs');

describe('employee_salary_particulars_controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            session: {
                Email: 'test@example.com',
                Employee_type: 'Employee',
                ETI_weekdayIndex: 3
            }
        };
            
        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        PDFDocument.mockImplementation(() => ({
            pipe: jest.fn(),
            fontSize: jest.fn().mockReturnThis(),
            text: jest.fn().mockReturnThis(),
            moveDown: jest.fn().mockReturnThis(),
            end: jest.fn()
        }));

        fs.createWriteStream.mockReturnValue({
            on: jest.fn(),
            end: jest.fn()
        });
    });

    describe('get_salary_particulars', () => {
        
        //failed
        it('should render the employee-salaryParticulars page with data', async () => {

            //set up the mock employee record
            const mockEmployee = {
                First_Name: 'John',
                Last_Name: 'Doe',
                Email: 'test@example.com',
                Employee_Type: 'Employee'
            };

            const mockPayroll = {
                Mon_Hours: 8, Tue_Hours: 8, Wed_Hours: 8, Thu_Hours: 8, Fri_Hours: 8, Sat_Hours: 8, Sun_Hours: 8,
                Mon_OT_Hours: 2, Tue_OT_Hours: 2, Wed_OT_Hours: 2, Thu_OT_Hours: 2, Fri_OT_Hours: 2, Sat_OT_Hours: 2, Sun_OT_Hours: 2,
                Mon_Total_Pay: 80, Tue_Total_Pay: 80, Wed_Total_Pay: 80, Thu_Total_Pay: 80, Fri_Total_Pay: 80, Sat_Total_Pay: 80, Sun_Total_Pay: 80,
                Mon_OT_Compensation: 20, Tue_OT_Compensation: 20, Wed_OT_Compensation: 20, Thu_OT_Compensation: 20, Fri_OT_Compensation: 20, Sat_OT_Compensation: 20, Sun_OT_Compensation: 20,
                Mon_Date: '2024-01-01', Tue_Date: '2024-01-02', Wed_Date: '2024-01-03', Thu_Date: '2024-01-04', Fri_Date: '2024-01-05', Sat_Date: '2024-01-06', Sun_Date: '2024-01-07',
                Deduction_PAGIBIG_Contribution: 100, Deduction_Philhealth: 200, Deduction_SSS: 300, Weekly_Total_Advance: 50, Weekly_Total_Pay: 500
            };

            database.findOne.mockImplementation((model, query) => {
                if (model === employee) return Promise.resolve(mockEmployee);
                if (model === payroll) return Promise.resolve(mockPayroll);
            });

            await employee_salary_particulars_controllers.get_salary_particulars(req, res);

            //calculate the expected data to be rendered
            const Total_OT_Hours = 14; // 2 hours per day * 7 days
            const Total_OT_Compensation = 140; // 20 compensation per day * 7 days
            const Total_Hours = 56; // 8 hours per day * 7 days
            const Total_Basic_Hours = Total_Hours - Total_OT_Hours; // 42
            const Total_Pay = 560; // 80 pay per day * 7 days
            const Total_Basic_Pay = Total_Pay - Total_OT_Compensation; // 420
            const Total_Holiday_Hours = 56; // All days are considered holidays
            const Total_Holiday_Pay = 560; // Same as Total_Pay in this case

            //verify that the page was rendered with the correct data
            expect(res.render).toHaveBeenCalledWith("employee-salaryParticulars", expect.objectContaining({
                email: 'test@example.com',
                emp_type: 'Employee',
                ETI_weekdayIndex: 1,
                emp_rec: mockEmployee,
                emp_pay: mockPayroll,
                Total_Basic_Hours,
                Total_Basic_Pay,
                Total_OT_Hours,
                Total_OT_Compensation,
                Total_Holiday_Hours,
                Total_Holiday_Pay
            }));
        });

    });

    describe('post_print_salary_particulars', () => {

        //failed
        it('should generate and serve a PDF with salary particulars', async () => {

            //set up the mock employee and payroll data
            const mockEmployee = {
                First_Name: 'John',
                Last_Name: 'Doe',
                Email: 'test@example.com',
                Employee_Type: 'Employee'
            };

            const mockPayroll = {
                Mon_Hours: 8, Tue_Hours: 8, Wed_Hours: 8, Thu_Hours: 8, Fri_Hours: 8, Sat_Hours: 8, Sun_Hours: 8,
                Mon_OT_Hours: 2, Tue_OT_Hours: 2, Wed_OT_Hours: 2, Thu_OT_Hours: 2, Fri_OT_Hours: 2, Sat_OT_Hours: 2, Sun_OT_Hours: 2,
                Mon_Total_Pay: 80, Tue_Total_Pay: 80, Wed_Total_Pay: 80, Thu_Total_Pay: 80, Fri_Total_Pay: 80, Sat_Total_Pay: 80, Sun_Total_Pay: 80,
                Mon_OT_Compensation: 20, Tue_OT_Compensation: 20, Wed_OT_Compensation: 20, Thu_OT_Compensation: 20, Fri_OT_Compensation: 20, Sat_OT_Compensation: 20, Sun_OT_Compensation: 20,
                Mon_Date: '2024-01-01', Tue_Date: '2024-01-02', Wed_Date: '2024-01-03', Thu_Date: '2024-01-04', Fri_Date: '2024-01-05', Sat_Date: '2024-01-06', Sun_Date: '2024-01-07',
                Deduction_PAGIBIG_Contribution: 100, Deduction_Philhealth: 200, Deduction_SSS: 300, Weekly_Total_Advance: 50, Weekly_Total_Pay: 500
            };

            database.findOne.mockImplementation((model, query) => {
                if (model === employee) return Promise.resolve(mockEmployee);
                if (model === payroll) return Promise.resolve(mockPayroll);
            });

            await employee_salary_particulars_controllers.post_print_salary_particulars(req, res);

            //verify that the pdf file was generated
            expect(PDFDocument).toHaveBeenCalled();
            expect(fs.createWriteStream).toHaveBeenCalled();
            expect(res.end).toHaveBeenCalled();

        });
    });

    it('should handle errors gracefully', async () => {
        //simulate database error
        database.findOne.mockResolvedValue(new Error('Database Error'));

        await employee_salary_particulars_controllers.post_print_salary_particulars(req, res);

        //verify that the error status code and erorr message was sent
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
    });


});