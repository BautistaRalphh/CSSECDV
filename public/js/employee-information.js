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
    const currentPassword = document.getElementById("edit-currentPassword").value;
    const password = document.getElementById("edit-password").value;
    const employeeTypeEl = document.getElementById("edit-employeeType");
    const employee_type = employeeTypeEl ? employeeTypeEl.value : null;

    if(!firstName || !lastName || !address || !contactNumber){
        showToast("Please fill in all required fields.", "warning");
        return;
    }

    if(password && !currentPassword){
        showToast("Please enter your current password to change the password.", "warning");
        return;
    }

    const contactRegex = /^09\d{9}$/;
    if(!contactRegex.test(contactNumber)){
        showToast("Invalid contact number format. Must be 11 digits starting with 09.", "error");
        return;
    }

    if(password){
        const pwErrors = validatePasswordClient(password);
        if(pwErrors.length > 0){
            showToast("Password must contain: " + pwErrors.join(', ') + ".", "error");
            return;
        }
    }

    try{
        const response = await fetch('/update_employee_info', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, firstName, lastName, address, contactNumber, currentPassword, password, employee_type})
        });
        const data = await response.json();
        if(data.success){
            showToast(data.message, "success");
        }else{
            showToast(data.message || "Update failed.", "error");
        }
    }catch(error){
        console.error('Error saving employee info:', error);
        showToast("An error occurred while saving.", "error");
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
            showToast(data.message, "success");
        }else{
            showToast(data.message || "Assignment failed.", "error");
        }
    }catch(error){
        console.error('Error assigning manager:', error);
        showToast("An error occurred while assigning manager.", "error");
    }
}

async function unlockAccount(){
    const email = document.getElementById("edit-email").value;

    try{
        const response = await fetch('/unlock_account', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email})
        });
        const data = await response.json();
        if(data.success){
            showToast(data.message, "success");
            // Refresh the employee record so the badge and button update
            setTimeout(() => {
                const selectedEmployee = document.getElementById("selectedEmployee");
                if(selectedEmployee){
                    const evt = new Event('change');
                    selectedEmployee.dispatchEvent(evt);
                }
            }, 800);
        }else{
            showToast(data.message || "Unlock failed.", "error");
        }
    }catch(error){
        console.error('Error unlocking account:', error);
        showToast("An error occurred while unlocking the account.", "error");
    }
}

// Password complexity policy (mirrors server-side rules)
function validatePasswordClient(password) {
    const errors = [];
    if (!password || password.length < 12)   errors.push("at least 12 characters long");
    if (!/[A-Z]/.test(password))             errors.push("at least one uppercase letter");
    if (!/[a-z]/.test(password))             errors.push("at least one lowercase letter");
    if (!/[0-9]/.test(password))             errors.push("at least one digit");
    if (!/[^A-Za-z0-9]/.test(password))      errors.push("at least one special character");
    return errors;
}

