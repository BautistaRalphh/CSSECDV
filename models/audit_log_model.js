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
        enum: ['LOGIN', 'LOGOUT'],
        required: true
    },
    Logged_At: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('audit_log', audit_log_schema);
