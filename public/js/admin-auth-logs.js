document.addEventListener('DOMContentLoaded', function () {
    wireLogFilters();
    fetchLogs();
});

function wireLogFilters() {
    const dateInput = document.getElementById('get-log-date-id');
    const actionInput = document.getElementById('get-log-action-id');

    if (!dateInput || !actionInput) {
        return;
    }

    if (!dateInput.value) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        dateInput.value = `${year}-${month}-${day}`;
    }

    dateInput.addEventListener('change', fetchLogs);
    actionInput.addEventListener('change', fetchLogs);
}

function fetchLogs() {
    const dateInput = document.getElementById('get-log-date-id');
    const actionInput = document.getElementById('get-log-action-id');

    fetch(`/retrieve_auth_logs?s_date=${dateInput.value}&action=${actionInput.value}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;
            wireLogFilters();
        })
        .catch(error => {
            console.error('Error fetching /retrieve_auth_logs:', error);
        });
}
