const mongoose = require('mongoose');

const Employee = require('./models/employee_model.js');
const DB = require('./models/database.js')
const add_data = {
    populateEmployees: function(){
    var employees = [
        {
          First_Name: 'John',
          Last_Name: 'Doe',
          Contact_Number: '1234567890',
          Email: 'john.doe@example.com',
          Password: 'password123',
          Address: '123 Main St, Anytown, USA',
          Employee_Type: 'Employee'
        },
        {
          First_Name: 'Jane',
          Last_Name: 'Smith',
          Contact_Number: '0987654321',
          Email: 'jane.smith@example.com',
          Password: 'password123',
          Address: '456 Elm St, Anytown, USA',
          Employee_Type: 'Admin'
        },
        {
          First_Name: 'Alice',
          Last_Name: 'Johnson',
          Contact_Number: '5555555555',
          Email: 'alice.johnson@example.com',
          Password: 'password123',
          Address: '789 Oak St, Anytown, USA',
          Employee_Type: 'Work From Home'
        }
      ]
      DB.insertMany(Employee, employees)
    }
}

module.exports = add_data;