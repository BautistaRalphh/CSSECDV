var curr_emp;

document.addEventListener("DOMContentLoaded", function () { 
    fetch("/admin_retrieve_employee_total_sp")
        .then(response =>{
            if (!response.ok){
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html =>{
            document.body.innerHTML = html; 
            dropdown();
        })
        .catch(error =>{
            console.error('Error fetching /admin_retrieve_employee_total_wp:', error);
        });
});

function dropdown(){
    var emp_dropdown_select = document.getElementById("emp-dropdown-id");

    emp_dropdown_select.addEventListener('change', function(){
        const selected_emp = emp_dropdown_select.value;
        curr_emp = selected_emp;
        fetch(`/admin_salary_particulars_employee?employee=${selected_emp}`)
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
                document.getElementById("current-emp-option").innerHTML = curr_emp;
                setupPrintFunction();
                dropdown();
                
            })
            .catch(error => {
                console.error('Error fetching /salary_particulars', error);
            });
        
    })
    

    function setupPrintFunction() { //disable print button if no selected data
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
}    
