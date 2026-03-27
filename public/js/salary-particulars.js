document.addEventListener("DOMContentLoaded", function () {
    fetch("/salary_particulars")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Create a temporary container to hold the fetched HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Find the specific part of the fetched HTML you want to append
            const fetchedContent = tempDiv.querySelector('.left-payroll.salary-container');

            // Append the fetched content to the existing container
            document.querySelector('.left-payroll.salary-container').replaceWith(fetchedContent);

            setupPrintFunction();
        })
        .catch(error => {
            console.error('Error fetching /salary_particulars', error);
        });

    function setupPrintFunction() {
        var printButton = document.getElementById("print-button");
        if (printButton) {
            printButton.addEventListener('click', printSalaryParticular);
        }

        function printSalaryParticular(event) {
            event.preventDefault();

            const salarySlip = document.getElementById('salary-slip');
            const employeeNameElem = document.getElementById('employee-name');
            const employeeEmailElem = document.getElementById('employee-email');
            const employeeTypeElem = document.getElementById('employee-type');

            if (salarySlip && employeeNameElem && employeeEmailElem && employeeTypeElem) {
                const printWindow = window.open('', '', 'height=600,width=800');
                printWindow.document.write('<html><head><title>Salary Particulars</title>');
                printWindow.document.write('<link rel="stylesheet" href="/css/style.css">'); // Ensure the CSS path is correct
                printWindow.document.write('</head><body>');
                printWindow.document.write('<div class="salary-container">');
                printWindow.document.write('<h1>Employee Salary Particulars</h1>');
                printWindow.document.write('<p><strong>Name:</strong> ' + employeeNameElem.innerText + '</p>');
                printWindow.document.write('<p><strong>Email:</strong> ' + employeeEmailElem.innerText + '</p>');
                printWindow.document.write('<p><strong>Employee Type:</strong> ' + employeeTypeElem.innerText + '</p>');
                printWindow.document.write(salarySlip.innerHTML);
                printWindow.document.write('</div>');
                printWindow.document.close();
                printWindow.print();
            } else {
                console.error('Required elements not found for printing.');
            }
        }
    }
});
