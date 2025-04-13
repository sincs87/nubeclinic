// Configuración inicial
const config = {
    today: new Date(), // Día actual
    selectedDate: new Date(), // Día seleccionado (inicialmente hoy)
    currentMonth: new Date(), // Mes actual para mostrar en el mini calendario
    timeSlotHeight: 15, // Altura en px de cada franja de 15 minutos
    zoomLevel: 1, // Nivel de zoom inicial
    viewType: 'day', // Tipo de vista inicial: 'day', 'week', 'list', 'hours'
    selectedSlot: null, // Slot horario seleccionado
    currentTime: new Date() // Hora actual
};

// Meses en español
const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 
    'Mayo', 'Junio', 'Julio', 'Agosto', 
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Días de la semana en español
const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando calendario...');
    
    // Inicializar calendario
    initCalendar();
    
    // Configurar eventos
    setupEventListeners();
    
    // Aplicar un único desplazamiento al cargar
    setTimeout(() => {
        // Solo aplicar si estamos viendo el día de hoy
        if (isSameDay(config.today, config.selectedDate)) {
            scrollToCurrentTime();
        } else {
            forceScrollToTop();
        }
    }, 500);
    
    // Actualizar la hora actual cada minuto
    setInterval(updateCurrentTime, 60000);
});

// Inicializar el calendario
function initCalendar() {
    // Actualizar visualización de la fecha
    updateMonthDisplay();
    updateDayDisplay();
    
    // Generar mini calendario
    generateCalendarGrid();
    
    // Generar franjas horarias
    generateTimeSlots();
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Navegación del mes
    document.getElementById('prevMonth').addEventListener('click', navigateToPreviousMonth);
    document.getElementById('nextMonth').addEventListener('click', navigateToNextMonth);
    
    // Navegación del día
    document.getElementById('prevDay').addEventListener('click', navigateToPreviousDay);
    document.getElementById('nextDay').addEventListener('click', navigateToNextDay);
    document.getElementById('goToToday').addEventListener('click', goToToday);
    
    // Zoom
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    
    // Cambio de vista
    document.querySelectorAll('.view-type-menu .dropdown-item[data-view]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            changeViewType(this.getAttribute('data-view'));
        });
    });
}

// Generar mini calendario
function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('No se encontró el elemento #calendarGrid');
        return;
    }

    calendarGrid.innerHTML = '';

    const year = config.currentMonth.getFullYear();
    const month = config.currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayToShow = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstDayToShow.setDate(firstDayOfMonth.getDate() - daysToSubtract);

    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(firstDayToShow);
        currentDay.setDate(firstDayToShow.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'mini-calendar-day';
        dayElement.textContent = currentDay.getDate();

        if (currentDay.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }

        // Si el día es hoy y también está seleccionado, dale solo la clase .today
        if (isSameDay(currentDay, config.today) && isSameDay(currentDay, config.selectedDate)) {
            dayElement.classList.add('today');
        } 
        // Si es el día actual pero no está seleccionado → no marcar
        else if (isSameDay(currentDay, config.today)) {
            // No añadir nada (no se resalta si no está seleccionado)
        } 
        // Si es el día seleccionado (pero no hoy)
        else if (isSameDay(currentDay, config.selectedDate)) {
            dayElement.classList.add('selected');
        }

        dayElement.addEventListener('click', function () {
            selectDay(currentDay);
        });

        calendarGrid.appendChild(dayElement);
    }
}

// Generar franjas horarias con divisiones de 15 minutos
function generateTimeSlots() {
    const timeSlots = document.getElementById('timeSlots');
    if (!timeSlots) {
        console.error('No se encontró el elemento #timeSlots');
        return;
    }
    
    timeSlots.innerHTML = '';
    
    // Crear un espaciador visible para asegurar que la primera hora sea visible
    const spacer = document.createElement('div');
    spacer.className = 'time-slot-spacer';
    spacer.style.height = '20px';  // Aumentado para dar más espacio
    spacer.style.padding = '0';
    spacer.style.margin = '0';
    timeSlots.appendChild(spacer);
    
    // Obtener la hora actual
    const currentHour = config.currentTime.getHours();
    const currentMinute = config.currentTime.getMinutes();
    
    // Generar franjas hora por hora desde 01:00 hasta 23:00
    for (let hour = 1; hour <= 23; hour++) {
        // Crear el contenedor de la hora
        const hourContainer = document.createElement('div');
        hourContainer.className = 'hour-container';
        hourContainer.dataset.hour = hour;
        
        // Crear la etiqueta de la hora
        const timeLabel = document.createElement('span');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        hourContainer.appendChild(timeLabel);
        
        // Crear 4 slots de 15 minutos dentro de cada hora
        for (let minute = 0; minute < 60; minute += 15) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.hour = hour;
            timeSlot.dataset.minute = minute;
            timeSlot.dataset.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Establecer altura según zoom
            timeSlot.style.height = `${config.timeSlotHeight * config.zoomLevel}px`;
            
            // Marcar slot de hora actual si corresponde
            if (isSameDay(config.currentTime, config.selectedDate) && 
                hour === currentHour && 
                minute <= currentMinute && 
                minute + 15 > currentMinute) {
                timeSlot.classList.add('current-time');
                
                // Añadir línea indicadora de hora actual
                const currentTimeLine = document.createElement('div');
                currentTimeLine.className = 'current-time-line';
                
                // Calcular posición dentro del slot (0-100%)
                const minutePosition = ((currentMinute - minute) / 15) * 100;
                currentTimeLine.style.top = `${minutePosition}%`;
                
                timeSlot.appendChild(currentTimeLine);
            }
            
            // Añadir eventos para selección
            timeSlot.addEventListener('click', function(e) {
                e.preventDefault();
                selectTimeSlot(hour, minute);
            });
            
            hourContainer.appendChild(timeSlot);
        }
        
        timeSlots.appendChild(hourContainer);
    }
    
    console.log('Franjas horarias generadas');
    
    // Forzar scroll a 0 otra vez para asegurarnos
    setTimeout(forceScrollToTop, 10);
}

// Seleccionar franja horaria
function selectTimeSlot(hour, minute) {
    // Limpiar selección previa
    clearSelectedTimeSlots();
    
    // Guardar slot seleccionado
    config.selectedSlot = {
        hour: hour,
        minute: minute
    };
    
    // Calcular la hora y minuto final (1 hora después)
    let endHour = hour;
    let endMinute = minute;
    
    // Seleccionar el slot actual y los 3 siguientes (total 1 hora)
    for (let i = 0; i < 4; i++) {
        const slotHour = endHour;
        const slotMinute = endMinute;
        
        // Seleccionar el slot actual
        const slot = document.querySelector(`.time-slot[data-hour="${slotHour}"][data-minute="${slotMinute}"]`);
        if (slot) {
            slot.classList.add('selected');
        }
        
        // Calcular el siguiente slot
        endMinute += 15;
        if (endMinute >= 60) {
            endMinute = 0;
            endHour++;
        }
    }
    
    // Mostrar panel lateral de citas con la hora seleccionada
    showAppointmentPanel(hour, minute);
}

// Limpiar selección de slots
function clearSelectedTimeSlots() {
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    config.selectedSlot = null;
}

// Mostrar panel lateral para crear cita
function showAppointmentPanel(hour, minute) {
    // Verificar si el panel ya existe
    let appointmentPanel = document.querySelector('.appointment-panel');
    
    // Si no existe, utilizar el template existente en el HTML
    if (!appointmentPanel || appointmentPanel.style.display === 'none') {
        appointmentPanel = document.getElementById('appointmentPanelTemplate');
        if (appointmentPanel) {
            appointmentPanel.style.display = 'flex';
        } else {
            console.error('No se encontró el panel de citas');
            return;
        }
    }
    
    // Formatear fecha y hora para mostrar
    const selectedDate = config.selectedDate;
    const formattedDate = `${weekdays[selectedDate.getDay()]}., ${selectedDate.getDate()} de ${months[selectedDate.getMonth()].substring(0, 3).toLowerCase()} de ${selectedDate.getFullYear()}`;
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Actualizar los datos en el panel
    const dateElement = document.getElementById('appointmentDate');
    const timeElement = document.getElementById('appointmentTime');
    
    if (dateElement) dateElement.textContent = formattedDate;
    if (timeElement) timeElement.textContent = startTime;
    
    // Añadir evento para cerrar el panel si no está ya configurado
    const closeBtn = appointmentPanel.querySelector('.close-btn');
    if (closeBtn && !closeBtn.hasEventListener) {
        closeBtn.addEventListener('click', function() {
            closeAppointmentPanel();
        });
        closeBtn.hasEventListener = true;
    }
    
    const cancelBtn = appointmentPanel.querySelector('.btn-light');
    if (cancelBtn && !cancelBtn.hasEventListener) {
        cancelBtn.addEventListener('click', function() {
            closeAppointmentPanel();
        });
        cancelBtn.hasEventListener = true;
    }
    
// Añadir eventos a los botones de cerrar alertas
    const alertCloseButtons = appointmentPanel.querySelectorAll('.alert-close');
    alertCloseButtons.forEach(button => {
        if (!button.hasEventListener) {
            button.addEventListener('click', function() {
                const alert = this.closest('.alert');
                if (alert) {
                    alert.style.display = 'none';
                }
            });
            button.hasEventListener = true;
        }
    });
    
// Añadir eventos a los títulos de sección para expandir/contraer
    const sectionTitles = appointmentPanel.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        if (!title.hasEventListener) {
            title.addEventListener('click', function() {
                const content = this.nextElementSibling;
                const icon = this.querySelector('.collapse-icon');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    if (icon) icon.classList.remove('fa-chevron-down');
                    if (icon) icon.classList.add('fa-chevron-up');
                } else {
                    content.style.display = 'none';
                    if (icon) icon.classList.remove('fa-chevron-up');
                    if (icon) icon.classList.add('fa-chevron-down');
                }
            });
            title.hasEventListener = true;
        }
    });
    
    // Mostrar el panel y ajustar el contenedor principal
    setTimeout(() => {
        appointmentPanel.classList.add('show');
        document.querySelector('.calendar-container').classList.add('panel-open');
    }, 10);
}

// Función para cerrar el panel de citas
function closeAppointmentPanel() {
    const appointmentPanel = document.getElementById('appointmentPanelTemplate');
    const calendarContainer = document.querySelector('.calendar-container');
    
    if (appointmentPanel) {
        appointmentPanel.classList.remove('show');
        
        // Esperar a que termine la animación para ocultar completamente
        setTimeout(() => {
            appointmentPanel.style.display = 'none';
            
            // Restaurar el ancho original del contenedor principal
            if (calendarContainer) {
                calendarContainer.classList.remove('panel-open');
            }
            
            // Limpiar la selección
            clearSelectedTimeSlots();
        }, 300); // La misma duración que la transición CSS
    }
}

// Actualizar visualización del mes
function updateMonthDisplay() {
    const monthTitle = document.getElementById('currentMonth');
    if (monthTitle) {
        monthTitle.textContent = `${months[config.currentMonth.getMonth()]} ${config.currentMonth.getFullYear()}`;
    }
}

// Actualizar visualización del día
function updateDayDisplay() {
    const currentDay = document.getElementById('currentDay');
    if (currentDay) {
        const day = config.selectedDate.getDate();
        const month = config.selectedDate.getMonth();
        const year = config.selectedDate.getFullYear();
        const weekday = config.selectedDate.getDay();
        
        currentDay.textContent = `${weekdays[weekday]}., ${day} de ${months[month].substring(0, 3).toLowerCase()} de ${year}`;
    }
}

// Actualizar toda la vista
function updateCalendarView() {
    updateMonthDisplay();
    updateDayDisplay();

    // Actualizar mini calendario lateral
    generateCalendarGrid();

    // Si la vista es semana, generar la vista de semana
    if(config.viewType === 'week'){
        generateWeekView();
    } else {
        // En vista de día, generar las franjas horarias
        generateTimeSlots();
    }
    
    // Forzar scroll a 0 (si fuera necesario)
    forceScrollToTop();
}

// Navegar al mes anterior
function navigateToPreviousMonth() {
    const newMonth = new Date(config.currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    config.currentMonth = newMonth;
    
    updateMonthDisplay();
    generateCalendarGrid();
}

// Navegar al mes siguiente
function navigateToNextMonth() {
    const newMonth = new Date(config.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    config.currentMonth = newMonth;
    
    updateMonthDisplay();
    generateCalendarGrid();
}

// Navegar al día anterior
function navigateToPreviousDay() {
    const newDate = new Date(config.selectedDate);
    if(config.viewType === 'week'){
        newDate.setDate(newDate.getDate() - 7);
    } else {
        newDate.setDate(newDate.getDate() - 1);
    }
    config.selectedDate = newDate;

    if(newDate.getMonth() !== config.currentMonth.getMonth() || 
       newDate.getFullYear() !== config.currentMonth.getFullYear()){
        config.currentMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    }
    
    updateCalendarView();
    
    // Si cambiamos a hoy, centrar en la hora actual
    if (isSameDay(config.today, config.selectedDate)) {
        setTimeout(scrollToCurrentTime, 300);
    }
}

// Navegar al día siguiente
function navigateToNextDay() {
    const newDate = new Date(config.selectedDate);
    if(config.viewType === 'week'){
        newDate.setDate(newDate.getDate() + 7);
    } else {
        newDate.setDate(newDate.getDate() + 1);
    }
    config.selectedDate = newDate;

    if(newDate.getMonth() !== config.currentMonth.getMonth() || 
       newDate.getFullYear() !== config.currentMonth.getFullYear()){
        config.currentMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    }
    
    updateCalendarView();
    
    // Si cambiamos a hoy, centrar en la hora actual
    if (isSameDay(config.today, config.selectedDate)) {
        setTimeout(scrollToCurrentTime, 300);
    }
}

// Ir a hoy
function goToToday() {
    config.selectedDate = new Date(config.today);
    config.currentMonth = new Date(config.today.getFullYear(), config.today.getMonth(), 1);
    
    updateCalendarView();
    
    // Al ir a hoy, centrar en la hora actual
    setTimeout(scrollToCurrentTime, 300);
}

// Seleccionar un día específico
function selectDay(date) {
    config.selectedDate = new Date(date);

    if (config.selectedDate.getMonth() !== config.currentMonth.getMonth() ||
        config.selectedDate.getFullYear() !== config.currentMonth.getFullYear()) {
        config.currentMonth = new Date(config.selectedDate.getFullYear(), config.selectedDate.getMonth(), 1);
    }

    updateCalendarView();
    
    // Si seleccionamos hoy, centrar en la hora actual
    if (isSameDay(config.today, config.selectedDate)) {
        setTimeout(scrollToCurrentTime, 300);
    }
}

// Aumentar zoom
function zoomIn() {
    if (config.zoomLevel < 2) {
        config.zoomLevel += 0.25;
        generateTimeSlots();
    }
}

// Disminuir zoom
function zoomOut() {
    if (config.zoomLevel > 0.5) {
        config.zoomLevel -= 0.25;
        generateTimeSlots();
    }
}

// Cambiar tipo de vista
function changeViewType(viewType) {
    config.viewType = viewType;

    // Actualizar el texto del botón del dropdown
    const button = document.getElementById('viewTypeDropdown');
    if (button) {
        button.textContent = getViewTypeText(viewType);
    }

    // Cambiar el botón azul y el encabezado de la parte superior
    const goToTodayButton = document.getElementById('goToToday');
    const currentDayLabel = document.getElementById('currentDay');

    if (viewType === 'week') {
        goToTodayButton.textContent = 'Semana';
        currentDayLabel.textContent = getCurrentWeekLabel(config.selectedDate);
    } else {
        goToTodayButton.textContent = 'Hoy';
        updateDayDisplay();
    }

    console.log('Vista cambiada a:', viewType);
    updateCalendarView();
}

function getCurrentWeekLabel(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day; // lunes como inicio
    start.setDate(start.getDate() + diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `Semana del ${start.getDate()}/${start.getMonth() + 1} al ${end.getDate()}/${end.getMonth() + 1}`;
}

// Obtener texto para el tipo de vista
function getViewTypeText(viewType) {
    switch (viewType) {
        case 'list': return 'Lista de citas';
        case 'day': return 'Día';
        case 'week': return 'Semana';
        case 'hours': return 'Horas disponibles';
        default: return 'Día';
    }
}

// Forzar scroll a 0
function forceScrollToTop() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (calendarGrid) {
        calendarGrid.scrollTop = 0;
        console.log('Scroll forzado a 0');
        
        // Asegurar que la primera hora es visible
        const firstHour = document.querySelector('.hour-container[data-hour="1"]');
        if (firstHour) {
            // Asegurar que el primer slot está completamente visible
            const headerHeight = document.querySelector('.main-header').offsetHeight;
            const topOffset = firstHour.getBoundingClientRect().top;
            const mainContentTop = document.querySelector('.main-content').getBoundingClientRect().top;
            
            if (topOffset - mainContentTop < headerHeight + 5) {
                // Si está parcialmente oculta, ajustar scroll
                calendarGrid.scrollTop = 0;
            }
        }
    }
}

// Comprobar si dos fechas son el mismo día
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Formatear fecha para debugging
function formatDate(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// Función para actualizar la hora actual
function updateCurrentTime() {
    config.currentTime = new Date();
    
    // Actualizar la visualización de la hora actual
    const currentTimeSlot = document.querySelector('.current-time');
    if (currentTimeSlot) {
        currentTimeSlot.classList.remove('current-time');
        const timeLine = currentTimeSlot.querySelector('.current-time-line');
        if (timeLine) timeLine.remove();
    }
    
    // Solo actualizar si estamos viendo el día actual
    if (isSameDay(config.currentTime, config.selectedDate)) {
        const currentHour = config.currentTime.getHours();
        const currentMinute = config.currentTime.getMinutes();
        const minuteSlot = Math.floor(currentMinute / 15) * 15;
        
        const newCurrentSlot = document.querySelector(`.time-slot[data-hour="${currentHour}"][data-minute="${minuteSlot}"]`);
        if (newCurrentSlot) {
            newCurrentSlot.classList.add('current-time');
            
            // Añadir línea indicadora de hora actual
            const currentTimeLine = document.createElement('div');
            currentTimeLine.className = 'current-time-line';
            
            // Calcular posición dentro del slot (0-100%)
            const minutePosition = ((currentMinute - minuteSlot) / 15) * 100;
            currentTimeLine.style.top = `${minutePosition}%`;
            
            newCurrentSlot.appendChild(currentTimeLine);
            
            // Centrar la vista en la hora actual si estamos viendo el día actual
            scrollToCurrentTime();
        }
    }
}

// Función para desplazarse hasta la hora actual
function scrollToCurrentTime() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;
    
    // Solo centrar en hora actual si estamos viendo el día de hoy
    if (!isSameDay(config.today, config.selectedDate)) {
        forceScrollToTop();
        return;
    }
    
    const currentHour = config.currentTime.getHours();
    // Buscar 2 horas antes para centrar (o la primera hora si no hay suficientes)
    const targetHour = Math.max(1, currentHour - 2);
    const targetSlot = document.querySelector(`.hour-container[data-hour="${targetHour}"]`);
    
    if (targetSlot) {
        // Usar un temporizador para asegurar que los elementos estén renderizados
        setTimeout(() => {
            // Calcular la posición para centrar considerando la altura del header
            const headerHeight = document.querySelector('.main-header').offsetHeight || 0;
            const targetTop = targetSlot.offsetTop - headerHeight - 50; // 50px de margen adicional
            
            // Aplicar el scroll
            calendarGrid.scrollTop = targetTop;
            console.log(`Scroll a hora ${targetHour}:00, posición: ${targetTop}px`);
        }, 200);
    } else {
        forceScrollToTop();
    }
}

// Llamada adicional para asegurar scroll adecuado
window.addEventListener('load', function() {
    scrollToCurrentTime();
    setTimeout(scrollToCurrentTime, 100);
    setTimeout(scrollToCurrentTime, 500);
});

function generateWeekView() {
    const calendarContent = document.getElementById('calendarContent');
    if (!calendarContent) {
        console.error('No se encontró el elemento #calendarContent');
        return;
    }
    calendarContent.innerHTML = ''; // Limpiar contenido anterior

    // Contenedor para la vista de semana
    const weekContainer = document.createElement('div');
    weekContainer.className = 'week-view-container';

    // Determinar el inicio de la semana (lunes)
    const startOfWeek = new Date(config.selectedDate);
    const day = startOfWeek.getDay();
    // En JavaScript, getDay() devuelve 0 para domingo; si es domingo, retrocede 6, sino, retrocede hasta lunes
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    // Generar 7 columnas para la semana
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayColumn = document.createElement('div');
        dayColumn.className = 'week-day-column';

        // Encabezado con día, mes completo y año
        const header = document.createElement('div');
        header.className = 'week-day-header';
        header.textContent = `${weekdays[dayDate.getDay()]}, ${dayDate.getDate()} ${months[dayDate.getMonth()]} ${dayDate.getFullYear()}`;
        dayColumn.appendChild(header);

        // Contenedor para las franjas horarias del día
        const daySlots = document.createElement('div');
        daySlots.className = 'day-slots';
        
        // Generar franjas horarias para este día
        for (let hour = 1; hour <= 23; hour++) {
            // Contenedor de la hora
            const hourContainer = document.createElement('div');
            hourContainer.className = 'hour-container';
            hourContainer.dataset.hour = hour;
            hourContainer.dataset.day = i;
            
            // Etiqueta de la hora
            const timeLabel = document.createElement('span');
            timeLabel.className = 'time-label';
            timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
            hourContainer.appendChild(timeLabel);
            
            // 4 slots de 15 minutos
            for (let minute = 0; minute < 60; minute += 15) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.dataset.hour = hour;
                timeSlot.dataset.minute = minute;
                timeSlot.dataset.day = i;
                timeSlot.dataset.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                // Altura según zoom
                timeSlot.style.height = `${config.timeSlotHeight * config.zoomLevel}px`;
                
                // Evento de clic
                timeSlot.addEventListener('click', function(e) {
                    e.preventDefault();
                    const slotDay = new Date(startOfWeek);
                    slotDay.setDate(startOfWeek.getDate() + parseInt(this.dataset.day));
                    config.selectedDate = slotDay;
                    selectTimeSlot(hour, minute);
                });
                
                hourContainer.appendChild(timeSlot);
            }
            
            daySlots.appendChild(hourContainer);
        }
        
        dayColumn.appendChild(daySlots);
        weekContainer.appendChild(dayColumn);
    }

    calendarContent.appendChild(weekContainer);
}