document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Select2 para especialidades
    $('#specialties').select2({
        placeholder: 'Seleccione sus especialidades',
        allowClear: true,
        tags: true,
        width: '100%'
    });

    // Autocompletar ciudades con Google Places API
    const locationInput = document.getElementById('location');
    if (locationInput) {
        const autocomplete = new google.maps.places.Autocomplete(locationInput, {
            types: ['(cities)'],
            componentRestrictions: { country: 'es' }
        });

        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (!place.address_components) return;

            // Extraer provincia
            let province = '';
            for (const component of place.address_components) {
                if (component.types.includes('administrative_area_level_2') ||
                    component.types.includes('administrative_area_level_1')) {
                    province = component.long_name;
                    break;
                }
            }
            document.getElementById('province').value = province;
        });
    }

    // Botón para usar nombre completo como nombre de clínica
    const useFullNameBtn = document.getElementById('use_full_name');
    if (useFullNameBtn) {
        useFullNameBtn.addEventListener('click', function() {
            const nameInput = document.getElementById('name');
            const surnameInput = document.getElementById('surname');
            const clinicNameInput = document.getElementById('clinic_name');

            if (nameInput && surnameInput && clinicNameInput) {
                clinicNameInput.value = `${nameInput.value} ${surnameInput.value}`.trim();
                
                // Actualizar vista previa
                updateProfilePreview();
            }
        });
    }

    // Validación de email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value) && emailInput.value.trim() !== '') {
                emailInput.classList.add('is-invalid');
                if (!emailInput.nextElementSibling || !emailInput.nextElementSibling.classList.contains('invalid-feedback')) {
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.textContent = 'Por favor, introduce un email válido';
                    emailInput.parentNode.appendChild(feedback);
                }
            } else {
                emailInput.classList.remove('is-invalid');
                const feedback = emailInput.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.remove();
                }
            }
        });
    }

    // Comprobador de fortaleza de contraseña
    const passwordInput = document.getElementById('password');
    const progressBar = document.querySelector('.password-strength .progress-bar');
    const strengthText = document.querySelector('.password-strength-text');

    if (passwordInput && progressBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(passwordInput.value);
            progressBar.style.width = `${strength}%`;
            
            // Actualizar color basado en la fortaleza
            if (strength < 30) {
                progressBar.className = 'progress-bar bg-danger';
                strengthText.textContent = 'Contraseña muy débil';
            } else if (strength < 60) {
                progressBar.className = 'progress-bar bg-warning';
                strengthText.textContent = 'Contraseña moderada';
            } else {
                progressBar.className = 'progress-bar bg-success';
                strengthText.textContent = 'Contraseña fuerte';
            }
        });
    }

    // Generar contraseña segura
    const generatePasswordBtn = document.getElementById('generate_password');
    if (generatePasswordBtn && passwordInput) {
        generatePasswordBtn.addEventListener('click', function() {
            const password = generateStrongPassword();
            passwordInput.value = password;
            passwordInput.type = 'text'; // Mostrar la contraseña generada
            
            // Actualizar indicador de fortaleza
            const strength = calculatePasswordStrength(password);
            progressBar.style.width = `${strength}%`;
            progressBar.className = 'progress-bar bg-success';
            strengthText.textContent = 'Contraseña fuerte';
            
            // Cambiar ícono del botón de mostrar contraseña
            const toggleBtn = document.querySelector('.toggle-password');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                icon.className = 'fas fa-eye-slash';
            }
            
            // Después de 3 segundos, ocultar la contraseña
            setTimeout(() => {
                passwordInput.type = 'password';
                const icon = document.querySelector('.toggle-password i');
                if (icon) icon.className = 'fas fa-eye';
            }, 3000);
        });
    }

    // Botón para mostrar/ocultar contraseña
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.querySelector(targetId);
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Cambiar ícono
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    });

    // Actualizar vista previa del perfil cuando se modifican los campos
    const updatePreviewFields = ['name', 'surname', 'specialties', 'location'];
    updatePreviewFields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.addEventListener('input', updateProfilePreview);
            input.addEventListener('change', updateProfilePreview);
        }
    });

    // Inicializar la vista previa
    updateProfilePreview();

    // Función para actualizar la vista previa del perfil
    function updateProfilePreview() {
        const nameInput = document.getElementById('name');
        const surnameInput = document.getElementById('surname');
        const specialtiesSelect = document.getElementById('specialties');
        const locationInput = document.getElementById('location');
        
        const previewName = document.querySelector('.profile-preview h5');
        const previewDetails = document.querySelector('.profile-preview p');
        
        if (previewName && nameInput && surnameInput) {
            const firstName = nameInput.value || 'Tu nombre';
            const lastName = surnameInput.value || '';
            previewName.textContent = `${firstName} ${lastName}`;
        }
        
        if (previewDetails && specialtiesSelect && locationInput) {
            // Obtener la primera especialidad seleccionada
            let specialty = 'Tu especialidad';
            if (specialtiesSelect.selectedOptions.length > 0) {
                specialty = specialtiesSelect.selectedOptions[0].text;
            }
            
            const city = locationInput.value || 'Tu ciudad';
            previewDetails.textContent = `${specialty} · ${city}`;
        }
    }

    // Función para calcular la fortaleza de la contraseña (0-100)
    function calculatePasswordStrength(password) {
        if (!password) return 0;
        
        let strength = 0;
        
        // Longitud
        strength += Math.min(password.length * 4, 25);
        
        // Letras minúsculas
        if (/[a-z]/.test(password)) strength += 10;
        
        // Letras mayúsculas
        if (/[A-Z]/.test(password)) strength += 15;
        
        // Números
        if (/\d/.test(password)) strength += 15;
        
        // Caracteres especiales
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
        
        // Combinaciones
        if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) strength += 5;
        if (/\d.*[a-zA-Z]|[a-zA-Z].*\d/.test(password)) strength += 5;
        if (/[^a-zA-Z0-9].*[a-zA-Z0-9]|[a-zA-Z0-9].*[^a-zA-Z0-9]/.test(password)) strength += 5;
        
        return Math.min(strength, 100);
    }

    // Función para generar una contraseña segura
    function generateStrongPassword() {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+~`|}{[]\\:;?><,./-=';
        
        const allChars = lowercase + uppercase + numbers + special;
        let password = '';
        
        // Asegurar al menos un carácter de cada tipo
        password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        password += special.charAt(Math.floor(Math.random() * special.length));
        
        // Añadir caracteres aleatorios hasta llegar a 12
        for (let i = 0; i < 8; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        // Mezclar los caracteres
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }
});