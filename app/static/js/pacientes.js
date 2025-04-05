// JavaScript para el módulo de pacientes

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const addPatientBtn = document.getElementById('addPatientBtn');
    const savePatientBtn = document.getElementById('savePatientBtn');
    const newPatientForm = document.getElementById('newPatientForm');
    const searchPatientInput = document.getElementById('searchPatient');
    const addPhoneLink = document.getElementById('addPhoneLink');
    
    // Inicializar modal
    let addPatientModal;
    if (document.getElementById('addPatientModal')) {
        addPatientModal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    }

    // Abrir modal al hacer clic en el botón de añadir paciente
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', function() {
            if (addPatientModal) {
                addPatientModal.show();
            }
        });
    }

    // Manejar el guardado de un nuevo paciente
    if (savePatientBtn) {
        savePatientBtn.addEventListener('click', function() {
            if (!validateForm()) {
                return;
            }
            
            // Recopilar datos del formulario
            const formData = new FormData(newPatientForm);
            const pacienteData = {
                nombre: formData.get('nombre'),
                apellidos: formData.get('apellidos'),
                telefono: formData.get('telefono'),
                email: formData.get('email'),
                tipo_paciente: formData.get('tipo_paciente')
            };
            
            // Enviar datos al servidor
            fetch('/pacientes/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify(pacienteData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Cerrar el modal y recargar la página
                    if (addPatientModal) {
                        addPatientModal.hide();
                    }
                    showNotification('Paciente añadido correctamente', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showNotification('Error al guardar el paciente', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al guardar el paciente', 'error');
            });
        });
    }

    // Agregar otro teléfono
    if (addPhoneLink) {
        addPhoneLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obtener el contenedor del teléfono actual
            const telefonoContainer = document.querySelector('label[for="telefono"]').parentElement;
            
            // Crear el nuevo campo de teléfono
            const nuevoTelefono = document.createElement('div');
            nuevoTelefono.className = 'mb-3';
            nuevoTelefono.innerHTML = `
                <div class="input-group input-group-sm">
                    <span class="input-group-text">+34</span>
                    <input type="tel" class="form-control form-control-sm" name="telefono_adicional" placeholder="Teléfono adicional">
                    <button type="button" class="btn btn-outline-secondary btn-sm remove-phone">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Insertar después del contenedor del teléfono principal
            telefonoContainer.insertAdjacentElement('afterend', nuevoTelefono);
            
            // Añadir evento para eliminar el teléfono adicional
            const removeBtn = nuevoTelefono.querySelector('.remove-phone');
            removeBtn.addEventListener('click', function() {
                nuevoTelefono.remove();
            });
        });
    }
    
    // Manejadores para los filtros desplegables
    setupFilterHandlers('Autorizacion', 'Autorización para enviar comunicaciones comerciales');
    setupFilterHandlers('Contacto', 'Datos de contacto');
    setupFilterHandlers('Estado', 'Estado del paciente');
    
    // Manejador para el ordenamiento
    const aplicarOrdenarBtn = document.getElementById('aplicarOrdenar');
    if (aplicarOrdenarBtn) {
        aplicarOrdenarBtn.addEventListener('click', function() {
            const selectedOption = document.querySelector('input[name="ordenarRadio"]:checked');
            if (selectedOption) {
                const ordenarDropdown = document.getElementById('ordenarDropdown');
                ordenarDropdown.textContent = selectedOption.nextElementSibling.textContent;
                
                // Aquí iría la lógica para ordenar la tabla
                ordenarTabla(selectedOption.id);
                
                // Cerrar el dropdown
                document.querySelector('.dropdown-menu.show').classList.remove('show');
            }
        });
    }

    // Búsqueda de pacientes en tiempo real
    if (searchPatientInput) {
        searchPatientInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('tbody tr');
            
            tableRows.forEach(row => {
                const nombre = row.querySelector('td:first-child').textContent.toLowerCase();
                const numeroPaciente = row.querySelector('td:nth-child(2)').textContent;
                const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                const telefono = row.querySelector('td:nth-child(4)').textContent;
                
                if (nombre.includes(searchTerm) || 
                    numeroPaciente.includes(searchTerm) || 
                    email.includes(searchTerm) || 
                    telefono.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Inicializar tooltips y popovers de Bootstrap si existen
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Configurar edición inline para emails
    setupInlineEmailEditing();
    
    // Configurar edición inline para DNI
    setupInlineDniEditing();
    
    // Configurar edición inline para teléfonos
    setupInlinePhoneEditing();
});

// Función para validar el formulario
function validateForm() {
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    
    if (!nombre) {
        showNotification('El nombre del paciente es obligatorio', 'warning');
        return false;
    }
    
    if (!apellidos) {
        showNotification('Los apellidos del paciente son obligatorios', 'warning');
        return false;
    }
    
    return true;
}

// Función para obtener el token CSRF
function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
}

// Función para mostrar notificaciones
function showNotification(message, type) {
    // Aquí podrías implementar una notificación más elegante
    if (type === 'error') {
        alert('Error: ' + message);
    } else if (type === 'warning') {
        alert('Aviso: ' + message);
    } else {
        alert(message);
    }
}

// Función para configurar los manejadores de los filtros desplegables
function setupFilterHandlers(filterName, defaultText) {
    const borrarBtn = document.getElementById(`borrar${filterName}`);
    const aplicarBtn = document.getElementById(`aplicar${filterName}`);
    const filterDropdown = document.getElementById(`filter${filterName}`);
    
    if (borrarBtn && aplicarBtn && filterDropdown) {
        // Manejador para el botón Borrar
        borrarBtn.addEventListener('click', function() {
            // Desmarcar todos los radio buttons
            document.querySelectorAll(`input[name*="${filterName.toLowerCase()}Radio"]`).forEach(radio => {
                radio.checked = false;
            });
            
            // Restablecer el texto del dropdown
            filterDropdown.textContent = defaultText;
            
            // Aplicar el filtro (en este caso, mostrar todos)
            aplicarFiltro(filterName, null);
        });
        
        // Manejador para el botón Aplicar
        aplicarBtn.addEventListener('click', function() {
            const selectedOptions = [];
            
            // Recopilar todas las opciones seleccionadas
            document.querySelectorAll(`input[name*="${filterName.toLowerCase()}Radio"]:checked`).forEach(radio => {
                selectedOptions.push({
                    id: radio.id,
                    text: radio.nextElementSibling.textContent
                });
            });
            
            if (selectedOptions.length > 0) {
                // Actualizar el texto del dropdown con la primera opción seleccionada
                filterDropdown.textContent = selectedOptions[0].text;
                
                // Aplicar el filtro
                aplicarFiltro(filterName, selectedOptions);
                
                // Cerrar el dropdown
                document.querySelector('.dropdown-menu.show').classList.remove('show');
            }
        });
    }
}

// Función para aplicar filtros a la tabla
function aplicarFiltro(filterName, options) {
    const tableRows = document.querySelectorAll('tbody tr');
    
    // Si no hay opciones seleccionadas, mostrar todas las filas
    if (!options || options.length === 0) {
        tableRows.forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    // Aplicar el filtro según el tipo
    tableRows.forEach(row => {
        let showRow = false;
        
        switch(filterName) {
            case 'Autorizacion':
                const autorizacion = row.querySelector('td:nth-last-child(1)').textContent.trim();
                showRow = options.some(opt => {
                    if (opt.id === 'autorizacionAceptado') return autorizacion === 'Aceptado';
                    if (opt.id === 'autorizacionNoAceptado') return autorizacion === 'No aceptado';
                    return false;
                });
                break;
                
            case 'Contacto':
                const email = row.querySelector('td:nth-child(3)').textContent.trim();
                const telefono = row.querySelector('td:nth-child(4)').textContent.trim();
                
                showRow = options.some(opt => {
                    if (opt.id === 'emailDisponible') return email !== 'Añadir email' && email.includes('@');
                    if (opt.id === 'emailNoDisponible') return email === 'Añadir email' || !email.includes('@');
                    if (opt.id === 'telefonoDisponible') return telefono !== '-' && telefono.length > 0;
                    if (opt.id === 'telefonoNoDisponible') return telefono === '-' || telefono.length === 0;
                    return false;
                });
                break;
                
            case 'Estado':
                // En este caso, asumimos que no tenemos una columna de estado visible
                // y vamos a basarnos en si hay próximas visitas o no
                const siguienteVisita = row.querySelector('td:nth-child(6)').textContent.trim();
                
                showRow = options.some(opt => {
                    if (opt.id === 'estadoActivo') return siguienteVisita !== '-' && siguienteVisita !== 'Crear cita';
                    if (opt.id === 'estadoInactivo') return siguienteVisita === '-' || siguienteVisita === 'Crear cita';
                    // Fallecido no lo podemos determinar con la información actual
                    return false;
                });
                break;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// Función para ordenar la tabla
function ordenarTabla(criterio) {
    const tbody = document.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((rowA, rowB) => {
        let valueA, valueB;
        
        switch(criterio) {
            case 'ordenarNombre':
                valueA = rowA.querySelector('td:first-child').textContent.trim().toLowerCase();
                valueB = rowB.querySelector('td:first-child').textContent.trim().toLowerCase();
                break;
                
            case 'ordenarApellido':
                // Extraer el apellido (asumimos formato "Nombre Apellido")
                const fullNameA = rowA.querySelector('td:first-child').textContent.trim();
                const fullNameB = rowB.querySelector('td:first-child').textContent.trim();
                valueA = fullNameA.split(' ').slice(1).join(' ').toLowerCase();
                valueB = fullNameB.split(' ').slice(1).join(' ').toLowerCase();
                break;
                
            case 'ordenarUltimaVisita':
                valueA = rowA.querySelector('td:nth-child(5)').textContent.trim();
                valueB = rowB.querySelector('td:nth-child(5)').textContent.trim();
                // Convertir fechas formato "DD-MM-YYYY HH:MM" a valores comparables
                if (valueA !== '-') {
                    const [dateA, timeA] = valueA.split(' ');
                    const [dayA, monthA, yearA] = dateA.split('-');
                    valueA = new Date(`${yearA}-${monthA}-${dayA}T${timeA}`);
                } else {
                    valueA = new Date(0); // Fecha muy antigua
                }
                
                if (valueB !== '-') {
                    const [dateB, timeB] = valueB.split(' ');
                    const [dayB, monthB, yearB] = dateB.split('-');
                    valueB = new Date(`${yearB}-${monthB}-${dayB}T${timeB}`);
                } else {
                    valueB = new Date(0); // Fecha muy antigua
                }
                
                return valueB - valueA; // Orden descendente (más reciente primero)
                
            case 'ordenarSiguienteVisita':
                valueA = rowA.querySelector('td:nth-child(6)').textContent.trim();
                valueB = rowB.querySelector('td:nth-child(6)').textContent.trim();
                
                // Si no hay próxima visita, poner al final
                if (valueA === '-' || valueA === 'Crear cita') return 1;
                if (valueB === '-' || valueB === 'Crear cita') return -1;
                
                // Convertir fechas formato "DD-MM-YYYY HH:MM" a valores comparables
                const [dateA, timeA] = valueA.split(' ');
                const [dayA, monthA, yearA] = dateA.split('-');
                valueA = new Date(`${yearA}-${monthA}-${dayA}T${timeA}`);
                
                const [dateB, timeB] = valueB.split(' ');
                const [dayB, monthB, yearB] = dateB.split('-');
                valueB = new Date(`${yearB}-${monthB}-${dayB}T${timeB}`);
                
                return valueA - valueB; // Orden ascendente (más próxima primero)
                
            case 'ordenarNumeroPaciente':
                valueA = parseInt(rowA.querySelector('td:nth-child(2)').textContent.trim());
                valueB = parseInt(rowB.querySelector('td:nth-child(2)').textContent.trim());
                break;
                
            default:
                return 0;
        }
        
        // Comparación general para casos string
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return valueA.localeCompare(valueB);
        }
        
        // Comparación numérica
        return valueA - valueB;
    });
    
    // Vaciar y reconstruir la tabla con el nuevo orden
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    rows.forEach(row => {
        tbody.appendChild(row);
    });
}

// FUNCIONALIDAD DE EDICIÓN INLINE PARA EMAILS
function setupInlineEmailEditing() {
    // Seleccionar todos los enlaces de añadir email
    const addEmailLinks = document.querySelectorAll('.add-email-link');
    
    addEmailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obtener el ID del paciente
            const pacienteId = this.getAttribute('data-id');
            const parentCell = this.parentNode;
            
            // Reemplazar el enlace con un input
            parentCell.innerHTML = `
                <input type="email" class="form-control form-control-sm inline-email-input" placeholder="Añadir email">
            `;
            
            // Enfocar el input
            const emailInput = parentCell.querySelector('.inline-email-input');
            emailInput.focus();
            
            // Guardar email al presionar Enter
            emailInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const email = this.value.trim();
                    if (email) {
                        guardarEmail(pacienteId, email, parentCell);
                    } else {
                        restaurarEnlaceEmail(parentCell, pacienteId);
                    }
                }
            });
            
            // Guardar email al quitar el foco
            emailInput.addEventListener('blur', function() {
                const email = this.value.trim();
                if (email) {
                    guardarEmail(pacienteId, email, parentCell);
                } else {
                    restaurarEnlaceEmail(parentCell, pacienteId);
                }
            });
        });
    });
}

function guardarEmail(pacienteId, email, parentCell) {
    // Validar el email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('El email no es válido');
        const emailInput = parentCell.querySelector('.inline-email-input');
        emailInput.focus();
        return;
    }
    
    // Mostrar indicador de carga
    parentCell.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
    
    // Enviar la solicitud para guardar el email
    fetch(`/pacientes/${pacienteId}/agregar-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mostrar el email guardado
            parentCell.textContent = email;
        } else {
            alert('Error al guardar el email: ' + (data.error || 'Error desconocido'));
            restaurarEnlaceEmail(parentCell, pacienteId);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar el email');
        restaurarEnlaceEmail(parentCell, pacienteId);
    });
}

function restaurarEnlaceEmail(parentCell, pacienteId) {
    parentCell.innerHTML = `
        <a href="javascript:void(0)" class="add-email-link" data-id="${pacienteId}">
            <i class="fas fa-plus-circle text-primary me-1"></i> Añadir email
        </a>
    `;
    
    // Re-adjuntar el evento click
    const newLink = parentCell.querySelector('.add-email-link');
    newLink.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        const cell = this.parentNode;
        
        cell.innerHTML = `
            <input type="email" class="form-control form-control-sm inline-email-input" placeholder="Añadir email">
        `;
        
        const input = cell.querySelector('.inline-email-input');
        input.focus();
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.value.trim();
                if (value) {
                    guardarEmail(id, value, cell);
                } else {
                    restaurarEnlaceEmail(cell, id);
                }
            }
        });
        
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                guardarEmail(id, value, cell);
            } else {
                restaurarEnlaceEmail(cell, id);
            }
        });
    });
}

// FUNCIONALIDAD DE EDICIÓN INLINE PARA DNI
function setupInlineDniEditing() {
    const addDniLinks = document.querySelectorAll('.add-dni-link');
    
    addDniLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pacienteId = this.getAttribute('data-id');
            const parentCell = this.parentNode;
            
            parentCell.innerHTML = `
                <input type="text" class="form-control form-control-sm inline-dni-input" placeholder="Añadir DNI">
            `;
            
            const dniInput = parentCell.querySelector('.inline-dni-input');
            dniInput.focus();
            
            dniInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const dni = this.value.trim();
                    if (dni) {
                        guardarDni(pacienteId, dni, parentCell);
                    } else {
                        restaurarEnlaceDni(parentCell, pacienteId);
                    }
                }
            });
            
            dniInput.addEventListener('blur', function() {
                const dni = this.value.trim();
                if (dni) {
                    guardarDni(pacienteId, dni, parentCell);
                } else {
                    restaurarEnlaceDni(parentCell, pacienteId);
                }
            });
        });
    });
}

function guardarDni(pacienteId, dni, parentCell) {
    parentCell.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
    
    fetch(`/pacientes/${pacienteId}/agregar-dni`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ dni: dni })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            parentCell.textContent = dni;
        } else {
            alert('Error al guardar el DNI: ' + (data.error || 'Error desconocido'));
            restaurarEnlaceDni(parentCell, pacienteId);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar el DNI');
        restaurarEnlaceDni(parentCell, pacienteId);
    });
}

function restaurarEnlaceDni(parentCell, pacienteId) {
    parentCell.innerHTML = `
        <a href="javascript:void(0)" class="add-dni-link" data-id="${pacienteId}">
            <i class="fas fa-plus-circle text-primary me-1"></i> Añadir DNI
        </a>
    `;
    
    const newLink = parentCell.querySelector('.add-dni-link');
    newLink.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        const cell = this.parentNode;
        
        cell.innerHTML = `
            <input type="text" class="form-control form-control-sm inline-dni-input" placeholder="Añadir DNI">
        `;
        
        const input = cell.querySelector('.inline-dni-input');
        input.focus();
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.value.trim();
                if (value) {
                    guardarDni(id, value, cell);
                } else {
                    restaurarEnlaceDni(cell, id);
                }
            }
        });
        
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                guardarDni(id, value, cell);
            } else {
                restaurarEnlaceDni(cell, id);
            }
        });
    });
}

// FUNCIONALIDAD DE EDICIÓN INLINE PARA TELÉFONO
function setupInlinePhoneEditing() {
    const addPhoneLinks = document.querySelectorAll('.add-phone-link');
    
    addPhoneLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pacienteId = this.getAttribute('data-id');
            const parentCell = this.parentNode;
            
            parentCell.innerHTML = `
                <div class="input-group input-group-sm">
                    <span class="input-group-text">+34</span>
                    <input type="tel" class="form-control form-control-sm inline-phone-input" placeholder="Añadir teléfono">
                </div>
            `;
            
            const phoneInput = parentCell.querySelector('.inline-phone-input');
            phoneInput.focus();
            
            phoneInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const telefono = this.value.trim();
                    if (telefono) {
                        guardarTelefono(pacienteId, telefono, parentCell);
                    } else {
                        restaurarEnlaceTelefono(parentCell, pacienteId);
                    }
                }
            });
            
            phoneInput.addEventListener('blur', function() {
                const telefono = this.value.trim();
                if (telefono) {
                    guardarTelefono(pacienteId, telefono, parentCell);
                } else {
                    restaurarEnlaceTelefono(parentCell, pacienteId);
                }
            });
        });
    });
}

function guardarTelefono(pacienteId, telefono, parentCell) {
    // Validar el formato del teléfono (solo números y al menos 9 dígitos)
    const phoneRegex = /^[0-9]{9,}$/;
    if (!phoneRegex.test(telefono)) {
        alert('El número de teléfono debe contener al menos 9 dígitos');
        const phoneInput = parentCell.querySelector('.inline-phone-input');
        phoneInput.focus();
        return;
    }
    
    parentCell.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
    
    fetch(`/pacientes/${pacienteId}/agregar-telefono`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ telefono: telefono })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            parentCell.textContent = `+34 ${telefono}`;
        } else {
            alert('Error al guardar el teléfono: ' + (data.error || 'Error desconocido'));
            restaurarEnlaceTelefono(parentCell, pacienteId);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar el teléfono');
        restaurarEnlaceTelefono(parentCell, pacienteId);
    });
}

function restaurarEnlaceTelefono(parentCell, pacienteId) {
    parentCell.innerHTML = `
        <a href="javascript:void(0)" class="add-phone-link" data-id="${pacienteId}">
            <i class="fas fa-plus-circle text-primary me-1"></i> Añadir teléfono
        </a>
    `;
    
    const newLink = parentCell.querySelector('.add-phone-link');
    newLink.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        const cell = this.parentNode;
        
        cell.innerHTML = `
            <div class="input-group input-group-sm">
                <span class="input-group-text">+34</span>
                <input type="tel" class="form-control form-control-sm inline-phone-input" placeholder="Añadir teléfono">
            </div>
        `;
        
        const input = cell.querySelector('.inline-phone-input');
        input.focus();
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.value.trim();
                if (value) {
                    guardarTelefono(id, value, cell);
                } else {
                    restaurarEnlaceTelefono(cell, id);
                }
            }
        });
        
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                guardarTelefono(id, value, cell);
            } else {
                restaurarEnlaceTelefono(cell, id);
            }
        });
    });
}