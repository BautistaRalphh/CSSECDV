/*
Functions:
-Request to server-side for new employee creation with the details inputted
*/

document.addEventListener("DOMContentLoaded", function(){
    var register_button_submit = document.getElementById("register-button");
    register_button_submit.addEventListener('click', register_function);

    async function register_function(event){
        event.preventDefault();

        var first_name_input = document.getElementById("firstName").value;
        var last_name_input = document.getElementById("lastName").value;
        var contact_input = document.getElementById("contactNumber").value;
        var email_input = document.getElementById("email").value;
        var password_input = document.getElementById("password").value;
        var address_input = document.getElementById("address").value;
        var employee_type_input = document.getElementById("employee-type").value;

        if (!first_name_input || !last_name_input || !password_input || !address_input) {
            showToast("Please fill in all fields.", "warning");
            return; 
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email_input)) {
            showToast("Invalid email format.", "error");
            return;
        }

        const contactRegex =/^09\d{9}$/
        if (!contactRegex.test(contact_input)) {
            showToast("Invalid contact number format. Must be 11 digits starting with 09.", "error");
            return;
        }

        const pwErrors = validatePasswordClient(password_input);
        if(pwErrors.length > 0){
            showToast("Password must contain: " + pwErrors.join(', ') + ".", "error");
            return;
        }

        try{
            const response = await fetch('/register_employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: first_name_input,
                    lastName: last_name_input,
                    contactNumber: contact_input,
                    email: email_input,
                    password: password_input,
                    address: address_input,
                    employee_type: employee_type_input
                }),
            });
            const data = await response.json();
            if(data.success){
                togglePopup();
                togglePopup2();
            }else{
                togglePopup(); // close the confirm popup first
                showToast(data.message || "Registration failed.", "error");
            }
        }catch(error){
            console.error(error);
            showToast("An unexpected error occurred. Please try again.", "error");
        }
    }


})
function togglePopup(){
    document.getElementById("popup-2").classList.toggle("active");
}
function togglePopup2(){
    document.getElementById("popup-3").classList.toggle("active");
};

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
