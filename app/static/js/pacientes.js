// JavaScript para el módulo de pacientes

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const addPatientBtn = document.getElementById('addPatientBtn');
    const addPatientModal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    const savePatientBtn = document.getElementById('savePatientBtn');
    const newPatientForm = document.getElementById('newPatientForm');
    const searchPatientInput = document.getElementById('searchPatient');
    const addPhoneLink = document.getElementById('addPhoneLink');

    // Abrir modal al hacer clic en el botón de añadir paciente
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', function() {
            addPatientModal.show();
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
                    addPatientModal.hide();
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
                <div class="input-group">
                    <span class="input-group-text">+34</span>
                    <input type="tel" class="form-control" name="telefono_adicional" placeholder="Teléfono adicional">
                    <button type="button" class="btn btn-outline-secondary remove-phone">
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
        // Puedes implementar un sistema de notificaciones o usar alertas estándar
        // Por ahora, usemos alertas para simplificar
        if (type === 'error') {
            alert('Error: ' + message);
        } else if (type === 'warning') {
            alert('Aviso: ' + message);
        } else {
            alert(message);
        }
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
    
    // Inicializar tooltips y popovers de Bootstrap si existen
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

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

// Función para añadir email a un paciente existente
function addEmailToPaciente(pacienteId) {
    const email = prompt('Por favor, ingresa el email del paciente:');
    
    if (email) {
        fetch(`/pacientes/${pacienteId}/agregar-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.reload();
            } else {
                alert('Error al guardar el email');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar el email');
        });
    }
}

// Necesitamos actualizar también la ruta para crear pacientes
// Esta función permite crear un paciente desde el modal
function guardarPaciente() {
    const nombre = document.getElementById('nombre').value;
    const apellidos = document.getElementById('apellidos').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('email').value;
    const tipoPaciente = document.querySelector('input[name="tipo_paciente"]:checked').value;
    
    const data = {
        nombre: nombre,
        apellidos: apellidos,
        telefono: telefono,
        email: email,
        tipo_paciente: tipoPaciente
    };
    
    fetch('/pacientes/crear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar modal y recargar página
            const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
            modal.hide();
            window.location.reload();
        } else {
            alert('Error al guardar el paciente');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar el paciente');
    });
}