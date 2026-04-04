const AuditLog = require('../models/audit_log_model');

async function logAuditEvent({ 
    email, 
    employeeType, 
    action,
    targetEmail = null,
    route = null,
    details = null 

}) {
    if (!email || !employeeType || !action) {
        return;
    }

    try {
        await AuditLog.create({
            Email: email,
            Employee_Type: employeeType,
            Action: action,
            Target_Email: targetEmail,
            Route: route,
            Details: details
        });
    } catch (error) {
        console.error('Error recording audit log:', error);
    }
}

module.exports = {
    logAuditEvent
};
