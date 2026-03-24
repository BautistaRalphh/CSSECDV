/*
Functions:
-Request data for Admin: Employee Management - Employee Information Page depending on the chosen employee
-Save edits to employee info
-Assign manager to employee (admin only)
*/

var curr_emp;

function displayInfo(){
    var selectedEmployee = document.getElementById("selectedEmployee");
    var selectedEmployeeEmail = selectedEmployee.options[selectedEmployee.selectedIndex].text;
    curr_emp = selectedEmployeeEmail;

    fetch('/display_specific_employee_records', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: selectedEmployeeEmail }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(html => {
        document.body.innerHTML = html;
        document.getElementById("current-emp-option").innerHTML = curr_emp;
        document.getElementById('weekly-payroll').addEventListener('click', function() {
            window.location.href = 'admin_empman_payroll';
        });
    })
    .catch(error => {
        console.error('Error fetching /display_specific_employee_records', error);
    });
}

async function saveEmployeeInfo(){
    const email = document.getElementById("edit-email").value;
    const firstName = document.getElementById("edit-firstName").value;
    const lastName = document.getElementById("edit-lastName").value;
    const address = document.getElementById("edit-address").value;
    const contactNumber = document.getElementById("edit-contactNumber").value;
    const password = document.getElementById("edit-password").value;
    const employeeTypeEl = document.getElementById("edit-employeeType");
    const employee_type = employeeTypeEl ? employeeTypeEl.value : null;

    if(!firstName || !lastName || !address || !contactNumber){
        alert("Please fill in all required fields.");
        return;
    }

    const contactRegex = /^09\d{9}$/;
    if(!contactRegex.test(contactNumber)){
        alert("Invalid contact number format. Must be 11 digits starting with 09.");
        return;
    }

    try{
        const response = await fetch('/update_employee_info', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, firstName, lastName, address, contactNumber, password, employee_type})
        });
        const data = await response.json();
        if(data.success){
            alert(data.message);
        }else{
            alert(data.message || "Update failed.");
        }
    }catch(error){
        console.error('Error saving employee info:', error);
        alert("An error occurred while saving.");
    }
}

async function assignManager(){
    const email = document.getElementById("edit-email").value;
    const managerSelect = document.getElementById("manager-assign-select");
    const manager_email = managerSelect ? managerSelect.value : "";

    try{
        const response = await fetch('/assign_manager', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({employee_email: email, manager_email})
        });
        const data = await response.json();
        if(data.success){
            alert(data.message);
        }else{
            alert(data.message || "Assignment failed.");
        }
    }catch(error){
        console.error('Error assigning manager:', error);
        alert("An error occurred while assigning manager.");
    }
}

