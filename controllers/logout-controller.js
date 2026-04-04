/*
Functions:
-Logout the employee
-Destroy the session created
*/

const { logAuditEvent } = require('../utils/audit-log');

const logout_controller = {
    get_logout: function(req, res){
        const email = req.session.Email;
        const employeeType = req.session.Employee_Type;

        req.session.destroy(function(err){
            if(err) throw err;
            logAuditEvent({
                email,
                employeeType,
                action: 'LOGOUT'
            });
            res.redirect('/');
        });
    }
}

module.exports = logout_controller;
