document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del formulario
    const nameInput = document.getElementById('name');
    const surnameInput = document.getElementById('surname');
    const clinicNameInput = document.getElementById('clinic_name');
    const specialtiesInput = document.getElementById('specialties');
    const locationInput = document.getElementById('location');
    
    // Obtener referencias a los elementos de la vista previa
    const previewName = document.querySelector('.profile-preview h5');
    const previewDetails = document.querySelector('.profile-preview p');

    // Inicializar los campos del formulario con TagManager para las especialidades
    if (specialtiesInput) {
        const tagify = new Tagify(specialtiesInput, {
            whitelist: getAllSpecialties(),
            dropdown: {
                maxItems: 20,
                enabled: 0,
                closeOnSelect: false
            }
        });
        
        // Actualizar preview cuando cambian las etiquetas
        tagify.on('change', updateProfilePreview);
        tagify.on('add', updateProfilePreview);
        tagify.on('remove', updateProfilePreview);
    }

    // Agregar eventos de escucha para actualización en tiempo real
    if (nameInput) {
        nameInput.addEventListener('input', updateProfilePreview);
        nameInput.addEventListener('keyup', updateProfilePreview);
        nameInput.addEventListener('change', updateProfilePreview);
    }
    
    if (surnameInput) {
        surnameInput.addEventListener('input', updateProfilePreview);
        surnameInput.addEventListener('keyup', updateProfilePreview);
        surnameInput.addEventListener('change', updateProfilePreview);
    }
    
    if (clinicNameInput) {
        clinicNameInput.addEventListener('input', updateProfilePreview);
        clinicNameInput.addEventListener('keyup', updateProfilePreview);
        clinicNameInput.addEventListener('change', updateProfilePreview);
    }
    
    if (locationInput) {
        locationInput.addEventListener('input', updateProfilePreview);
        locationInput.addEventListener('keyup', updateProfilePreview);
        locationInput.addEventListener('change', updateProfilePreview);
    }

    // Inicializar Google Places Autocomplete para ciudades
    if (locationInput && window.google && window.google.maps && window.google.maps.places) {
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
            
            // Actualizar vista previa
            updateProfilePreview();
        });
    }

    // Ajustar el tamaño del prefijo de país
    const countryCodeSelect = document.getElementById('country_code');
    if (countryCodeSelect) {
        // Función para ajustar el ancho basado en el contenido seleccionado
        const adjustWidth = () => {
            const selectedOption = countryCodeSelect.options[countryCodeSelect.selectedIndex];
            const tempSpan = document.createElement('span');
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.style.font = window.getComputedStyle(countryCodeSelect).font;
            tempSpan.textContent = selectedOption.text;
            document.body.appendChild(tempSpan);
            
            const width = tempSpan.getBoundingClientRect().width;
            document.body.removeChild(tempSpan);
            
            // Añadir un margen para los bordes y el icono
            countryCodeSelect.style.width = `${width + 40}px`;
        };
        
        // Ajustar al inicio y cuando cambie
        adjustWidth();
        countryCodeSelect.addEventListener('change', adjustWidth);
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

    // Comprobador de fortaleza de contraseña
    const passwordInput = document.getElementById('password');
    const progressBar = document.querySelector('.password-strength .progress-bar');
    const strengthText = document.querySelector('.password-strength-text');

    if (passwordInput && progressBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = passwordInput.value;
            const strength = calculatePasswordStrength(password);
            
            progressBar.style.width = `${strength}%`;
            
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
            // Disparar el evento input para actualizar la barra de fortaleza
            const inputEvent = new Event('input', { bubbles: true });
            passwordInput.dispatchEvent(inputEvent);
            
            // Cambiar a texto para mostrar la contraseña generada temporalmente
            passwordInput.type = 'text';
            setTimeout(() => {
                passwordInput.type = 'password';
            }, 3000);
        });
    }

    // Botón para mostrar/ocultar contraseña
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.querySelector(targetId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.querySelector('i').className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                this.querySelector('i').className = 'fas fa-eye';
            }
        });
    });

    // Inicializar la vista previa
    updateProfilePreview();

    // Función para actualizar la vista previa del perfil
    function updateProfilePreview() {
        console.log("Actualizando vista previa del perfil"); // Para depuración
        
        if (previewName) {
            if (clinicNameInput && clinicNameInput.value.trim()) {
                previewName.textContent = clinicNameInput.value.trim();
            } else if (nameInput && surnameInput) {
                const firstName = nameInput.value || 'Tu nombre';
                const lastName = surnameInput.value || '';
                previewName.textContent = `${firstName} ${lastName}`.trim() || 'Tu nombre';
            }
        }
        
        if (previewDetails) {
            let specialty = 'Tu especialidad';
            
            // Obtener la primera especialidad (dependiendo de si usamos Tagify o no)
            if (specialtiesInput) {
                try {
                    // Si estamos usando Tagify
                    const tagifyValue = JSON.parse(specialtiesInput.value);
                    if (tagifyValue && tagifyValue.length > 0) {
                        specialty = tagifyValue[0].value;
                    }
                } catch (e) {
                    // Si estamos usando un select normal
                    if (specialtiesInput.tagName === 'SELECT' && specialtiesInput.options.length > 0) {
                        specialty = specialtiesInput.options[specialtiesInput.selectedIndex].text;
                    } else if (specialtiesInput.value) {
                        // Si es un input normal
                        specialty = specialtiesInput.value.split(',')[0].trim();
                    }
                }
            }
            
            const city = locationInput && locationInput.value ? locationInput.value.split(',')[0].trim() : 'Tu ciudad';
            previewDetails.textContent = `${specialty} · ${city}`;
        }
    }

    // Función para calcular la fortaleza de la contraseña (0-100)
    function calculatePasswordStrength(password) {
        if (!password) return 0;
        
        let strength = 0;
        
        // Longitud - hasta 25 puntos
        strength += Math.min(password.length * 3, 25);
        
        // Letras minúsculas - 10 puntos
        if (/[a-z]/.test(password)) strength += 10;
        
        // Letras mayúsculas - 15 puntos
        if (/[A-Z]/.test(password)) strength += 15;
        
        // Números - 15 puntos
        if (/\d/.test(password)) strength += 15;
        
        // Caracteres especiales - 20 puntos
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
        
        // Combinaciones - hasta 15 puntos adicionales
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
        return shuffleString(password);
    }
    
    // Función para mezclar un string
    function shuffleString(string) {
        const array = string.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }
    
    // Función para obtener todas las especialidades
    function getAllSpecialties() {
        return [
            "Acupuntor", "Alergólogo", "Analista clínico", "Patólogo", "Andrólogo", 
            "Anestesista", "Angiólogo y cirujano vascular", "Digestólogo", "Bioquímico", 
            "Cardiólogo", "Cirujano cardiovascular", "Cirujano general", 
            "Cirujano oral y maxilofacial", "Cirujano pediátrico", "Cirujano plástico", 
            "Cirujano torácico", "Dermatólogo", "Dermatólogo infantil", "Endocrino", 
            "Endocrinólogo pediátrico", "Enfermero", "Farmacólogo", "Fisioterapeuta", 
            "Geriatra", "Ginecólogo", "Hematólogo", "Homeópata", "Inmunólogo", "Logopeda", 
            "Urgenciólogo", "Especialista en Medicina del Deporte", 
            "Especialista en Medicina del Trabajo", "Médico estético", "Médico de familia", 
            "Médico rehabilitador", "Médico general", "Intensivista", "Internista", "Forense", 
            "Especialista en Medicina Nuclear", "Especialista en Medicina Preventiva", 
            "Microbiólogo", "Nefrólogo", "Neumólogo", "Neurocirujano", "Neurofisiólogo clínico", 
            "Neurólogo", "Neurólogo pediátrico", "Dietista Nutricionista", "Dentista", 
            "Dentista infantil", "Oftalmólogo", "Oncólogo médico", "Oncólogo radioterapéutico", 
            "Óptico", "Osteópata", "Otorrino", "Pediatra", "Podólogo", "Psicólogo", 
            "Psicólogo infantil", "Psicopedagogo", "Psiquiatra", "Psiquiatra infantil", 
            "Radiólogo", "Reumatólogo", "Terapeuta ocupacional", "Terapeuta complementario", 
            "Traumatólogo", "Urólogo", "Covid Test", "Cardiólogo pediátrico", 
            "Neumólogo pediátrico", "Alergólogo pediátrico", "Neonatólogo", 
            "Gastroenterólogo pediátrico", "Quiropráctico", "Sexólogo", "Podólogo Infantil", 
            "Otorrino Infantil", "Proctólogo", "Oftalmólogo Infantil", "Cirujano Bariátrico", 
            "Técnico imagen para el diagnóstico", "Matrona", "Higienista dental", 
            "Especialista en Medicina Regenerativa"
        ];
    }
});
if (nameInput) {
    nameInput.addEventListener('input', function() {
        const firstName = nameInput.value || 'Tu nombre';
        const lastName = surnameInput ? surnameInput.value : '';
        document.getElementById('preview-name').textContent = `${firstName} ${lastName}`.trim();
    });
}

if (surnameInput) {
    surnameInput.addEventListener('input', function() {
        const firstName = nameInput ? nameInput.value : 'Tu nombre';
        const lastName = surnameInput.value || '';
        document.getElementById('preview-name').textContent = `${firstName} ${lastName}`.trim();
    });
}