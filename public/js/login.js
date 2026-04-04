/*
Functions:
-Request for login credentials validation in the server-side
-Request for forgot password notifcations in the server-side
*/

document.addEventListener("DOMContentLoaded", function(){
    var login_button_submit = document.getElementById("login-button");
    login_button_submit.addEventListener('click', login_function);

    async function login_function(event){
        event.preventDefault();

        var email_input = document.getElementById("email").value;
        var password_input = document.getElementById("password").value;
        var error_message = document.getElementById("error_issue");

        try{
            const response = await fetch('/login_account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email_input,
                    password: password_input,
                }),
            });
            const data = await response.json();

            if(data.success){
                const redirectUrl = data.type === "Employee"        ? '/employee_clockpage'
                                  : data.type === "Work From Home"  ? '/work_from_home_clockpage'
                                  : data.type === "Manager"         ? '/admin_empman_emprecs'
                                  : '/admin_dashboard';

                // Build styled activity rows
                const hasActivity = data.lastLogin || data.lastFailedLogin;
                if(hasActivity){
                    const body = document.getElementById("activity-modal-body");
                    body.innerHTML = "";

                    if(data.lastLogin){
                        const row = document.createElement("div");
                        row.className = "activity-modal-row success";
                        row.innerHTML = `
                            <i class="fi fi-sr-check-circle"></i>
                            <div class="activity-modal-row-text">
                                <span class="activity-modal-row-label">Last successful login</span>
                                <span class="activity-modal-row-value">${new Date(data.lastLogin).toLocaleString()}</span>
                            </div>`;
                        body.appendChild(row);
                    }
                    if(data.lastFailedLogin){
                        const row = document.createElement("div");
                        row.className = "activity-modal-row warning";
                        row.innerHTML = `
                            <i class="fi fi-sr-triangle-warning"></i>
                            <div class="activity-modal-row-text">
                                <span class="activity-modal-row-label">Last failed login attempt</span>
                                <span class="activity-modal-row-value">${new Date(data.lastFailedLogin).toLocaleString()}</span>
                            </div>`;
                        body.appendChild(row);
                    }

                    document.getElementById("activity-modal-overlay").classList.add("active");
                    document.getElementById("activity-modal-continue").onclick = function(){
                        window.location.href = redirectUrl;
                    };
                }else{
                    window.location.href = redirectUrl;
                }
            }else{
                error_message.textContent = data.message;
            }
        }catch(error){
            console.error(error);
            error_message.textContent = "Login Controller Error";
        }
    } 
    
});

function togglePopup(){
    closeBtn();
    response_forms();
}

function closeBtn(){
    document.getElementById("popup-1").classList.toggle("active");
}

function response_forms(){
    var forgot_password_button_submit = document.getElementById("forgot-password-button-id");
    forgot_password_button_submit.addEventListener('click', forgot_password_function);
}

async function forgot_password_function(event){
    event.preventDefault();

    var email_input = document.getElementById("for-pas-email").value;

    var current_time = new Date();
    var hours = current_time.getHours();
    var minutes = current_time.getMinutes();
    var time = (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;

    try{
        const response = await fetch('/add_forgot_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email_input,
                cTime: time
            }),
        });
        const data = await response.json();

        if(data.success === true){
            alert(`Successfully sent forgot password notification.`);
            window.location.reload();
        }else if(data.success === false){
            alert(`Email does not exist or there is already a notification.`);
            document.getElementById("forgot-password-form-id").reset();
        }
    }catch(error){
        console.error(error);
    }
}

