/*
Functions:
Employee model/attributes
*/

var mongoose = require('mongoose');

var employee_schema = new mongoose.Schema({
    First_Name: {
        type: String,
        required: true
    },
    Last_Name: {
        type: String,
        required: true
    },
    Contact_Number: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Address:{
        type: String,
        required: true
    },
    Employee_Type: {
        type: String,
        default: 'Employee'
    },
    IsTimedIn: {
        type: Boolean,
        default: false
    },
    Manager_Email: {
        type: String,
        default: null
    },
    Failed_Login_Attempts: {
        type: Number,
        default: 0
    },
    Account_Locked: {
        type: Boolean,
        default: false
    },
    Account_Locked_At: {
        type: Date,
        default: null
    },
    Password_History: {
        type: [String],
        default: []
    },
    Password_Changed_At: {
        type: Date,
        default: null
    },
    Last_Login: {
        type: Date,
        default: null
    },
    Last_Failed_Login: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('employee', employee_schema);
