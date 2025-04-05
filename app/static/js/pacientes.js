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
    // Por defecto, seleccionar el primer elemento de cada filtro
    selectFirstOption('autorizacionRadio');
    selectFirstOption('telefonoRadio');
    selectFirstOption('emailRadio');
    selectFirstOption('estadoRadio');
    selectFirstOption('ordenarRadio');
    
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
                
                // Obtener el criterio de ordenación
                const ordenCriterio = getOrdenCriterio(selectedOption.id);
                
                // Construir la URL con el parámetro de ordenación
                const url = new URL(window.location.href);
                url.searchParams.set('orden', ordenCriterio);
                
                // Navegar a la nueva URL
                window.location.href = url.toString();
                
                // Cerrar el dropdown
                const dropdownMenu = document.querySelector('[aria-labelledby="ordenarDropdown"]');
                if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            }
        });
    }
    
    // Botón para borrar ordenación
    const borrarOrdenarBtn = document.getElementById('borrarOrdenar');
    if (borrarOrdenarBtn) {
        borrarOrdenarBtn.addEventListener('click', function() {
            // Desmarcar todos los radio buttons
            document.querySelectorAll('input[name="ordenarRadio"]').forEach(radio => {
                radio.checked = false;
            });
            
            // Seleccionar el primero por defecto
            selectFirstOption('ordenarRadio');
            
            // Restablecer el texto del dropdown
            const ordenarDropdown = document.getElementById('ordenarDropdown');
            if (ordenarDropdown) {
                ordenarDropdown.textContent = 'Ordenar por';
            }
            
            // Quitar el parámetro de ordenación de la URL
            const url = new URL(window.location.href);
            url.searchParams.delete('orden');
            
            // Navegar a la nueva URL
            window.location.href = url.toString();
            
            // Cerrar el dropdown manualmente
            const dropdownMenu = document.querySelector('[aria-labelledby="ordenarDropdown"]');
            if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // Búsqueda de pacientes en tiempo real
    if (searchPatientInput) {
        searchPatientInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('tbody tr');
            
            let resultsCount = 0;
            
            tableRows.forEach(row => {
                const nombre = row.querySelector('td:first-child').textContent.toLowerCase();
                const numeroPaciente = row.querySelector('td:nth-child(2)').textContent;
                
                // Extraer texto del email (puede ser un enlace o texto)
                let email = '';
                const emailCell = row.querySelector('td:nth-child(3)');
                if (emailCell) {
                    const emailLink = emailCell.querySelector('a');
                    if (emailLink) {
                        email = emailLink.textContent.trim().toLowerCase();
                    } else {
                        email = emailCell.textContent.trim().toLowerCase();
                    }
                }
                
                // Extraer texto del teléfono (puede ser un enlace o texto)
                let telefono = '';
                const telefonoCell = row.querySelector('td:nth-child(4)');
                if (telefonoCell) {
                    const telefonoLink = telefonoCell.querySelector('a');
                    if (telefonoLink) {
                        telefono = telefonoLink.textContent.trim().toLowerCase();
                    } else {
                        telefono = telefonoCell.textContent.trim().toLowerCase();
                    }
                }
                
                // Extraer texto del DNI (puede ser un enlace o texto)
                let dni = '';
                const dniCell = row.querySelector('td:nth-child(7)');
                if (dniCell) {
                    const dniLink = dniCell.querySelector('a');
                    if (dniLink) {
                        dni = dniLink.textContent.trim().toLowerCase();
                    } else {
                        dni = dniCell.textContent.trim().toLowerCase();
                    }
                }
                
                if (nombre.includes(searchTerm) || 
                    numeroPaciente.includes(searchTerm) || 
                    email.includes(searchTerm) || 
                    telefono.includes(searchTerm) ||
                    dni.includes(searchTerm)) {
                    row.style.display = '';
                    resultsCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Actualizar contador de resultados
            const resultCounter = document.querySelector('.small strong');
            if (resultCounter) {
                resultCounter.textContent = resultsCount;
            }
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
    
    // Seleccionar automáticamente las opciones según los parámetros de la URL
    setFiltersFromURL();
});

// Función para seleccionar el primer elemento de un grupo de radio buttons
function selectFirstOption(name) {
    const options = document.querySelectorAll(`input[name="${name}"]`);
    if (options && options.length > 0) {
        options[0].checked = true;
    }
}

// Función para establecer los filtros basados en los parámetros de la URL
function setFiltersFromURL() {
    const url = new URL(window.location.href);
    
    // Filtro de autorización
    if (url.searchParams.has('filtro') && url.searchParams.get('filtro') === 'autorizacion') {
        const valor = url.searchParams.get('valor');
        if (valor === 'Aceptado') {
            document.getElementById('autorizacionAceptado').checked = true;
            document.getElementById('filterAutorizacion').textContent = 'Aceptado';
        } else if (valor === 'No aceptado') {
            document.getElementById('autorizacionNoAceptado').checked = true;
            document.getElementById('filterAutorizacion').textContent = 'No aceptado';
        }
    }
    
    // Filtro de email
    if (url.searchParams.has('filtro') && url.searchParams.get('filtro') === 'email') {
        const valor = url.searchParams.get('valor');
        if (valor === 'disponible') {
            document.getElementById('emailDisponible').checked = true;
            document.getElementById('filterContacto').textContent = 'Email disponible';
        } else if (valor === 'no_disponible') {
            document.getElementById('emailNoDisponible').checked = true;
            document.getElementById('filterContacto').textContent = 'Email no disponible';
        }
    }
    
    // Filtro de teléfono
    if (url.searchParams.has('filtro') && url.searchParams.get('filtro') === 'telefono') {
        const valor = url.searchParams.get('valor');
        if (valor === 'disponible') {
            document.getElementById('telefonoDisponible').checked = true;
            document.getElementById('filterContacto').textContent = 'Teléfono disponible';
        } else if (valor === 'no_disponible') {
            document.getElementById('telefonoNoDisponible').checked = true;
            document.getElementById('filterContacto').textContent = 'Teléfono no disponible';
        }
    }
    
    // Filtro de estado
    if (url.searchParams.has('filtro') && url.searchParams.get('filtro') === 'estado') {
        const valor = url.searchParams.get('valor');
        if (valor === 'activo') {
            document.getElementById('estadoActivo').checked = true;
            document.getElementById('filterEstado').textContent = 'Activo';
        } else if (valor === 'inactivo') {
            document.getElementById('estadoInactivo').checked = true;
            document.getElementById('filterEstado').textContent = 'Inactivo';
        } else if (valor === 'fallecido') {
            document.getElementById('estadoFallecido').checked = true;
            document.getElementById('filterEstado').textContent = 'Fallecido';
        }
    }
    
    // Ordenación
    if (url.searchParams.has('orden')) {
        const orden = url.searchParams.get('orden');
        let radioId = '';
        let labelText = '';
        
        switch (orden) {
            case 'nombre':
                radioId = 'ordenarNombre';
                labelText = 'Nombre';
                break;
            case 'apellido':
                radioId = 'ordenarApellido';
                labelText = 'Apellido';
                break;
            case 'ultima_visita':
                radioId = 'ordenarUltimaVisita';
                labelText = 'Última visita realizada';
                break;
            case 'siguiente_visita':
                radioId = 'ordenarSiguienteVisita';
                labelText = 'Siguiente visita programada';
                break;
            case 'numero_paciente':
                radioId = 'ordenarNumeroPaciente';
                labelText = 'Número de paciente';
                break;
        }
        
        if (radioId) {
            const radio = document.getElementById(radioId);
            if (radio) {
                radio.checked = true;
            }
            
            const ordenarDropdown = document.getElementById('ordenarDropdown');
            if (ordenarDropdown) {
                ordenarDropdown.textContent = labelText;
            }
        }
    }
}

// Función para convertir el ID del radio button a criterio de ordenación para la URL
function getOrdenCriterio(radioId) {
    switch (radioId) {
        case 'ordenarNombre':
            return 'nombre';
        case 'ordenarApellido':
            return 'apellido';
        case 'ordenarUltimaVisita':
            return 'ultima_visita';
        case 'ordenarSiguienteVisita':
            return 'siguiente_visita';
        case 'ordenarNumeroPaciente':
            return 'numero_paciente';
        default:
            return 'nombre'; // Por defecto, ordenar por nombre
    }
}

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
            
            // Seleccionar el primero por defecto
            if (filterName === 'Contacto') {
                selectFirstOption('telefonoRadio');
                selectFirstOption('emailRadio');
            } else {
                selectFirstOption(`${filterName.toLowerCase()}Radio`);
            }
            
            // Restablecer el texto del dropdown
            filterDropdown.textContent = defaultText;
            
            // Eliminar el filtro de la URL y recargar
            const url = new URL(window.location.href);
            url.searchParams.delete('filtro');
            url.searchParams.delete('valor');
            window.location.href = url.toString();
        });
        
        // Manejador para el botón Aplicar
        aplicarBtn.addEventListener('click', function() {
            let filtroTipo = '';
            let filtroValor = '';
            
            // Determinar el tipo de filtro y valor según el filtro
            if (filterName === 'Autorizacion') {
                const autorizacionAceptado = document.getElementById('autorizacionAceptado');
                const autorizacionNoAceptado = document.getElementById('autorizacionNoAceptado');
                
                if (autorizacionAceptado && autorizacionAceptado.checked) {
                    filtroTipo = 'autorizacion';
                    filtroValor = 'Aceptado';
                } else if (autorizacionNoAceptado && autorizacionNoAceptado.checked) {
                    filtroTipo = 'autorizacion';
                    filtroValor = 'No aceptado';
                }
            } else if (filterName === 'Contacto') {
                const emailDisponible = document.getElementById('emailDisponible');
                const emailNoDisponible = document.getElementById('emailNoDisponible');
                const telefonoDisponible = document.getElementById('telefonoDisponible');
                const telefonoNoDisponible = document.getElementById('telefonoNoDisponible');
                
                if (emailDisponible && emailDisponible.checked) {
                    filtroTipo = 'email';
                    filtroValor = 'disponible';
                } else if (emailNoDisponible && emailNoDisponible.checked) {
                    filtroTipo = 'email';
                    filtroValor = 'no_disponible';
                } else if (telefonoDisponible && telefonoDisponible.checked) {
                    filtroTipo = 'telefono';
                    filtroValor = 'disponible';
                } else if (telefonoNoDisponible && telefonoNoDisponible.checked) {
                    filtroTipo = 'telefono';
                    filtroValor = 'no_disponible';
                }
            } else if (filterName === 'Estado') {
                const estadoActivo = document.getElementById('estadoActivo');
                const estadoInactivo = document.getElementById('estadoInactivo');
                const estadoFallecido = document.getElementById('estadoFallecido');
                
                if (estadoActivo && estadoActivo.checked) {
                    filtroTipo = 'estado';
                    filtroValor = 'activo';
                } else if (estadoInactivo && estadoInactivo.checked) {
                    filtroTipo = 'estado';
                    filtroValor = 'inactivo';
                } else if (estadoFallecido && estadoFallecido.checked) {
                    filtroTipo = 'estado';
                    filtroValor = 'fallecido';
                }
            }
            
            if (filtroTipo && filtroValor) {
                // Actualizar el texto del dropdown
                const selectedOption = document.querySelector(`input[name*="${filterName.toLowerCase()}Radio"]:checked`);
                if (selectedOption) {
                    filterDropdown.textContent = selectedOption.nextElementSibling.textContent;
                }
                
                // Aplicar el filtro redirigiendo a la URL con parámetros
                const url = new URL(window.location.href);
                url.searchParams.set('filtro', filtroTipo);
                url.searchParams.set('valor', filtroValor);
                window.location.href = url.toString();
            }
            
            // Cerrar el dropdown manualmente
            const dropdownMenu = document.querySelector(`[aria-labelledby="filter${filterName}"]`);
            if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
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
// Aplicar filtro a los registros de la tabla
function aplicarFiltro(filterName, options) {
    const tableRows = document.querySelectorAll('tbody tr');
    
    // Si no hay opciones seleccionadas, mostrar todas las filas
    if (!options || options.length === 0) {
        tableRows.forEach(row => {
            row.style.display = '';
        });
        
        // Actualizar contador de resultados
        const resultCounter = document.querySelector('.small strong');
        if (resultCounter) {
            resultCounter.textContent = tableRows.length;
        }
        
        return;
    }
    
    // Contador para filas visibles
    let visibleRowsCount = 0;
    
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
                const emailCell = row.querySelector('td:nth-child(3)');
                const telefonoCell = row.querySelector('td:nth-child(4)');
                
                // Extraer texto del email (puede ser un enlace o texto)
                let email = '';
                if (emailCell) {
                    const emailLink = emailCell.querySelector('a');
                    if (emailLink) {
                        email = emailLink.textContent.trim();
                    } else {
                        email = emailCell.textContent.trim();
                    }
                }
                
                // Extraer texto del teléfono (puede ser un enlace o texto)
                let telefono = '';
                if (telefonoCell) {
                    const telefonoLink = telefonoCell.querySelector('a');
                    if (telefonoLink) {
                        telefono = telefonoLink.textContent.trim();
                    } else {
                        telefono = telefonoCell.textContent.trim();
                    }
                }
                
                showRow = options.some(opt => {
                    if (opt.id === 'emailDisponible') 
                        return email !== 'Añadir email' && email.includes('@');
                    if (opt.id === 'emailNoDisponible') 
                        return email === 'Añadir email' || !email.includes('@');
                    if (opt.id === 'telefonoDisponible') 
                        return telefono !== 'Añadir teléfono' && telefono !== '-';
                    if (opt.id === 'telefonoNoDisponible') 
                        return telefono === 'Añadir teléfono' || telefono === '-';
                    return false;
                });
                break;
                
            case 'Estado':
                // Para el estado, nos basamos en si hay próximas visitas o no
                const siguienteVisitaCell = row.querySelector('td:nth-child(6)');
                let siguienteVisita = '';
                
                if (siguienteVisitaCell) {
                    siguienteVisita = siguienteVisitaCell.textContent.trim();
                }
                
                showRow = options.some(opt => {
                    if (opt.id === 'estadoActivo') 
                        return siguienteVisita !== 'Crear cita' && siguienteVisita !== '-';
                    if (opt.id === 'estadoInactivo') 
                        return siguienteVisita === 'Crear cita' || siguienteVisita === '-';
                    // Para "fallecido" sería necesario tener esa información en los datos
                    return false;
                });
                break;
        }
        
        // Mostrar u ocultar la fila según el resultado del filtro
        row.style.display = showRow ? '' : 'none';
        
        // Incrementar contador si la fila es visible
        if (showRow) {
            visibleRowsCount++;
        }
    });
    
    // Actualizar contador de resultados
    const resultCounter = document.querySelector('.small strong');
    if (resultCounter) {
        resultCounter.textContent = visibleRowsCount;
    }
}