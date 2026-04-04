/*
Functions:
-Display of local date and time
*/

setInterval(()=>{
    const time = document.querySelector("#time");
    const date = document.querySelector("#date");
    let clock = new Date();
    let hours = clock.getHours();
    let minutes = clock.getMinutes();
    let seconds = clock.getSeconds();

    let day = clock.getDate();
    let monthIndex = clock.getMonth();
    let weekdayIndex = clock.getDay();
    let year = clock.getFullYear();

    if(hours < 10){
        hours = "0"+ hours;
    }
    if(minutes < 10){
        minutes = "0"+ minutes;
    }
    if(seconds < 10){
        seconds = "0"+ seconds;
    }

    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let month = months[monthIndex];
    let weekday = weekdays[weekdayIndex];

    time.textContent = hours + ":" + minutes + ":" + seconds;
    date.textContent = weekday + ", " + month + " " + day + ", " + year;
})

/**
 * showToast(message, type)
 * type: 'error' | 'success' | 'warning'
 * Shared across all pages that load script.js
 */
function showToast(message, type = 'error') {
    const icons = {
        error:   'fi fi-sr-circle-xmark',
        success: 'fi fi-sr-check-circle',
        warning: 'fi fi-sr-triangle-warning'
    };
    const titles = { error: 'Error', success: 'Success', warning: 'Warning' };

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="toast-icon ${icons[type]}"></i>
        <div class="toast-body">
            <span class="toast-title">${titles[type]}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>`;

    container.appendChild(toast);

    const dismiss = () => {
        toast.classList.add('dismissing');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 5000);
}