const AuditLog = require('../models/audit_log_model');

async function logAuditEvent({ email, employeeType, action }) {
    if (!email || !employeeType || !action) {
        return;
    }

    try {
        await AuditLog.create({
            Email: email,
            Employee_Type: employeeType,
            Action: action
        });
    } catch (error) {
        console.error('Error recording audit log:', error);
    }
}

module.exports = {
    logAuditEvent
};
