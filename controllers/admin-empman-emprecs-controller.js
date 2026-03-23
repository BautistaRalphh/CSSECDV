/*
Functions:
-Display the admin-empman-emprecs.hbs (Admin: Employee Management - Employee Information Page)
-Populate the page with the corresponding employee details
*/

const employee = require('../models/employee_model.js');
const database = require('../models/database.js');

const admin_empman_emprecs_controller = {
    get_emprecs: async function(req, res){
        const requesterType = req.session.Employee_Type;
        // Managers only see Role B (Employee, WFH); Administrators see all
        const query = requesterType === "Manager"
            ? {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"}]}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);

        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            
            return emailA.localeCompare(emailB);
        });

    try{
        res.render("admin-empman-emprecs", {emp_emails});
    }catch (error){
        console.error("Error processing employee summary: ", error);
        res.status(500).send("Internal Server Error!");
    }
},

    post_specific_emprecs: async function(req, res){
        const requesterType = req.session.Employee_Type;
        const query = requesterType === "Manager"
            ? {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"}]}
            : {$or: [{Employee_Type: "Employee"},{Employee_Type: "Work From Home"},{Employee_Type: "Admin"},{Employee_Type: "Manager"}]};

        const emp_emails = await database.findMany(employee, query);
        const email = req.body.email;

        // Managers cannot view records of Admin or Manager accounts
        const target = await employee.findOne({Email: email});
        if(requesterType === "Manager" && target &&
           (target.Employee_Type === "Admin" || target.Employee_Type === "Manager")){
            return res.status(403).send("Insufficient privileges to view this record.");
        }
    
        emp_emails.sort((a, b) => {
            const emailA = (a.Email || '').toLowerCase();
            const emailB = (b.Email || '').toLowerCase();
            
            return emailA.localeCompare(emailB);
        });

        try {
            const emp_sum = await employee.findOne({ Email: email });
    
            res.render("admin-empman-emprecs", { emp_emails, emp_sum });
        } catch (error) {
            console.error("Error processing employee summary: ", error);
            res.status(500).send("Internal Server Error!");
        }
    }
}

module.exports = admin_empman_emprecs_controller;