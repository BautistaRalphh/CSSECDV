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
        const route = req.originalUrl;

        req.session.destroy(async function(err){
            if(err){
                console.error('Error destroying session:', err);
                return res.redirect('/');
            }

            try{
                await logAuditEvent({
                    email,
                    employeeType,
                    action: 'LOGOUT',
                    route,
                    details: 'User logged out'
                });
            }catch(error){
                console.error('Audit log failed:', error);
            }

            res.redirect('/');
        });
    }
}

module.exports = logout_controller;
