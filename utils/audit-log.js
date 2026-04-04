const AuditLog = require('../models/audit_log_model');

async function logAuditEvent({
    email,
    employeeType,
    action,
    targetEmail = null,
    route = null,
    details = null
}) {
    const safeEmail = email || 'GUEST';
    const safeEmployeeType = employeeType || 'Guest';

    if (!action) {
        return;
    }

    try {
        await AuditLog.create({
            Email: safeEmail,
            Employee_Type: safeEmployeeType,
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
