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

    // Referencias directas para la vista previa con IDs específicos (si existen)
    const previewNameById = document.getElementById('preview-name');
    const previewDetailsById = document.getElementById('preview-details');

    // Inicializar los campos del formulario con TagManager para las especialidades
    if (specialtiesInput) {
        try {
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
        } catch (e) {
            console.error("Error al inicializar Tagify:", e);
        }
    }

    // Agregar eventos de escucha para actualización en tiempo real
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            updateProfilePreview();
            // Actualización directa si tenemos el elemento con ID
            if (previewNameById) {
                const firstName = nameInput.value || 'Tu nombre';
                const lastName = surnameInput ? surnameInput.value : '';
                previewNameById.textContent = `${firstName} ${lastName}`.trim();
            }
        });
    }
    
    if (surnameInput) {
        surnameInput.addEventListener('input', function() {
            updateProfilePreview();
            // Actualización directa si tenemos el elemento con ID
            if (previewNameById) {
                const firstName = nameInput ? nameInput.value : 'Tu nombre';
                const lastName = surnameInput.value || '';
                previewNameById.textContent = `${firstName} ${lastName}`.trim();
            }
        });
    }
    
    if (clinicNameInput) {
        clinicNameInput.addEventListener('input', function() {
            updateProfilePreview();
            // Actualización directa si tenemos el elemento con ID
            if (previewNameById && clinicNameInput.value.trim()) {
                previewNameById.textContent = clinicNameInput.value.trim();
            }
        });
    }
    
    if (locationInput) {
        locationInput.addEventListener('input', function() {
            updateProfilePreview();
            // Actualización directa si tenemos el elemento con ID
            if (previewDetailsById) {
                const city = locationInput.value ? locationInput.value.split(',')[0].trim() : 'Tu ciudad';
                const specialty = getCurrentSpecialty();
                previewDetailsById.textContent = `${specialty} · ${city}`;
            }
        });
    }

    // Inicializar Google Places Autocomplete para ciudades
    if (locationInput) {
        // Verificar si Google Maps API está cargada
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            try {
                // Forzar z-index alto para que las sugerencias sean visibles
                document.head.insertAdjacentHTML('beforeend', `
                    <style>
                    .pac-container {
                        z-index: 10000 !important;
                    }
                    </style>
                `);
                
                console.log("Inicializando Google Places Autocomplete");
                
                const autocomplete = new google.maps.places.Autocomplete(locationInput, {
                    types: ['(cities)'],
                    componentRestrictions: { country: 'es' }
                });
                
                autocomplete.addListener('place_changed', function() {
                    console.log("Lugar seleccionado en autocompletado");
                    const place = autocomplete.getPlace();
                    if (!place.address_components) {
                        console.warn("No se recibieron componentes de dirección");
                        return;
                    }
                    
                    console.log("Lugar seleccionado:", place);
                    
                    // Extraer provincia
                    let province = '';
                    for (const component of place.address_components) {
                        if (component.types.includes('administrative_area_level_2') ||
                            component.types.includes('administrative_area_level_1')) {
                            province = component.long_name;
                            break;
                        }
                    }
                    
                    const provinceInput = document.getElementById('province');
                    if (provinceInput) {
                        provinceInput.value = province;
                        console.log("Provincia establecida:", province);
                    }
                    
                    // Actualizar vista previa
                    updateProfilePreview();
                });
            } catch (error) {
                console.error("Error al inicializar Google Places Autocomplete:", error);
            }
        } else {
            console.warn("Google Maps API no está disponible. Verifica que el script está cargado correctamente.");
        }
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
            if (nameInput && surnameInput && clinicNameInput) {
                clinicNameInput.value = `${nameInput.value} ${surnameInput.value}`.trim();
                
                // Actualizar vista previa
                updateProfilePreview();
                
                // Actualización directa si tenemos el elemento con ID
                if (previewNameById) {
                    previewNameById.textContent = clinicNameInput.value.trim();
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
        
        // Actualizar nombre en la vista previa
        if (previewName || previewNameById) {
            const elementToUpdate = previewNameById || previewName;
            
            if (clinicNameInput && clinicNameInput.value.trim()) {
                elementToUpdate.textContent = clinicNameInput.value.trim();
            } else if (nameInput && surnameInput) {
                const firstName = nameInput.value || 'Tu nombre';
                const lastName = surnameInput.value || '';
                elementToUpdate.textContent = `${firstName} ${lastName}`.trim() || 'Tu nombre';
            }
        }
        
        // Actualizar especialidad y ciudad en la vista previa
        if (previewDetails || previewDetailsById) {
            const elementToUpdate = previewDetailsById || previewDetails;
            const specialty = getCurrentSpecialty();
            const city = locationInput && locationInput.value ? locationInput.value.split(',')[0].trim() : 'Tu ciudad';
            elementToUpdate.textContent = `${specialty} · ${city}`;
        }
    }

    // Obtener la especialidad actual
    function getCurrentSpecialty() {
        let specialty = 'Tu especialidad';
            
        if (specialtiesInput) {
            try {
                // Si estamos usando Tagify
                const tagifyValue = JSON.parse(specialtiesInput.value);
                if (tagifyValue && tagifyValue.length > 0) {
                    specialty = tagifyValue[0].value;
                }
            } catch (e) {
                // Si estamos usando un select normal o el valor no es JSON válido
                if (specialtiesInput.tagName === 'SELECT' && specialtiesInput.options.length > 0) {
                    specialty = specialtiesInput.options[specialtiesInput.selectedIndex].text;
                } else if (specialtiesInput.value) {
                    // Si es un input normal
                    specialty = specialtiesInput.value.split(',')[0].trim();
                }
            }
        }
        
        return specialty;
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

    // Log para confirmar que el script se ejecutó
    console.log("Script de registro inicializado correctamente");
});