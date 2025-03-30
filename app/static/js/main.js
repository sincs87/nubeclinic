// Main JavaScript file for NubeClinic

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize Bootstrap popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Handle password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = document.querySelector(this.getAttribute('data-target'));
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });
    
    // Form validation for login and register
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
    
    // Specialty search autocomplete (placeholder for future implementation)
    const specialtyInput = document.querySelector('#specialty');
    if (specialtyInput) {
        // Here you would initialize an autocomplete library
        console.log('Specialty field detected, autocomplete would be initialized here');
    }
    
    // Location search autocomplete (placeholder for future implementation)
    const locationInput = document.querySelector('#location');
    if (locationInput) {
        // Here you would initialize a location autocomplete library
        console.log('Location field detected, autocomplete would be initialized here');
    }
    
    // Profile preview update on register form
    const registerForm = document.querySelector('#register-form');
    if (registerForm) {
        const firstNameInput = registerForm.querySelector('#first_name');
        const lastNameInput = registerForm.querySelector('#last_name');
        const specialtySelect = registerForm.querySelector('#specialty');
        const cityInput = registerForm.querySelector('#location');
        
        const previewName = document.querySelector('.profile-preview h5');
        const previewDetails = document.querySelector('.profile-preview p');
        
        const updatePreview = () => {
            if (previewName && firstNameInput && lastNameInput) {
                const firstName = firstNameInput.value || 'Tu nombre';
                const lastName = lastNameInput.value || '';
                previewName.textContent = `${firstName} ${lastName}`;
            }
            
            if (previewDetails && specialtySelect && cityInput) {
                const specialty = specialtySelect.value || 'Tu especialidad';
                const city = cityInput.value || 'Tu ciudad';
                previewDetails.textContent = `${specialty} · ${city}`;
            }
        };
        
        // Update on input change
        if (firstNameInput) firstNameInput.addEventListener('input', updatePreview);
        if (lastNameInput) lastNameInput.addEventListener('input', updatePreview);
        if (specialtySelect) specialtySelect.addEventListener('change', updatePreview);
        if (cityInput) cityInput.addEventListener('input', updatePreview);
    }
    
    // Alert auto-close
    const alerts = document.querySelectorAll('.alert-dismissible.auto-close');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeButton = alert.querySelector('.btn-close');
            if (closeButton) {
                closeButton.click();
            }
        }, 5000); // Auto close after 5 seconds
    });
});

// Function to handle Google login (placeholder)
function handleGoogleLogin() {
    console.log('Google login clicked');
    // Implement Google OAuth flow here
}

// Function to handle Apple login (placeholder)
function handleAppleLogin() {
    console.log('Apple login clicked');
    // Implement Apple OAuth flow here
}