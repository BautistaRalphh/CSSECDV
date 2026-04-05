const FIELD_LIMITS = {
    firstName:     { maxLength: 50,  label: 'First Name' },
    lastName:      { maxLength: 50,  label: 'Last Name' },
    address:       { maxLength: 200, label: 'Address' },
    contactNumber: { maxLength: 11,  label: 'Contact Number' },
    email:         { maxLength: 100, label: 'Email' },
    password:      { maxLength: 128, label: 'Password' }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_REGEX = /^09\d{9}$/;
const NAME_REGEX = /^[A-Za-z\s\-'.]+$/;

function validateEmployeeInput({ firstName, lastName, address, contactNumber, email, password }, requireAll = true) {
    const errors = [];

    // Required field checks
    if (requireAll) {
        if (!firstName) errors.push('First Name is required.');
        if (!lastName)  errors.push('Last Name is required.');
        if (!address)   errors.push('Address is required.');
        if (!contactNumber) errors.push('Contact Number is required.');
        if (!email)     errors.push('Email is required.');
    }

    // Length validation
    for (const [field, limits] of Object.entries(FIELD_LIMITS)) {
        const value = arguments[0][field];
        if (value && value.length > limits.maxLength) {
            errors.push(`${limits.label} must not exceed ${limits.maxLength} characters.`);
        }
    }

    // Range / format validation
    if (firstName && !NAME_REGEX.test(firstName)) {
        errors.push('First Name contains invalid characters.');
    }
    if (lastName && !NAME_REGEX.test(lastName)) {
        errors.push('Last Name contains invalid characters.');
    }
    if (email && !EMAIL_REGEX.test(email)) {
        errors.push('Invalid email format.');
    }
    if (contactNumber && !CONTACT_REGEX.test(contactNumber)) {
        errors.push('Contact Number must be 11 digits starting with 09.');
    }

    return errors;
}

module.exports = { validateEmployeeInput, FIELD_LIMITS };
