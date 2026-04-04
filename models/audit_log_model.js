const mongoose = require('mongoose');

const audit_log_schema = new mongoose.Schema({
    Email: {
        type: String,
        required: true
    },
    Employee_Type: {
        type: String,
        required: true
    },
    Action: {
        type: String,
        enum: [
            'LOGIN', 
            'LOGOUT',
            'UNAUTHORIZED_ACCESS',
            'AUTHORIZATION_FAILED',
            'EMPLOYEE_EDIT',
            'MANAGER_ASSIGNED'
        ],
        Target_Email: {
        type: String,
        default: null
    },
    Route: {
        type: String,
        default: null
    },
    Details: {
        type: String,
        default: null
    },
        required: true
    },
    Logged_At: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('audit_log', audit_log_schema);
