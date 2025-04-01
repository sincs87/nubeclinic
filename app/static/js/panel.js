// Configuración inicial
const config = {
    today: new Date(), // Día actual
    selectedDate: new Date(), // Día seleccionado (inicialmente hoy)
    currentMonth: new Date(), // Mes actual para mostrar en el mini calendario
    timeSlotHeight: 60, // Altura en px de cada franja horaria
    zoomLevel: 1, // Nivel de zoom inicial
    viewType: 'day' // Tipo de vista inicial: 'day', 'week', 'list', 'hours'
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
    
    // DESCOMENTAR PARA PRUEBAS
// COMENTAR ESTA LÍNEA EN PRODUCCIÓN
// simulateDate();    
    // Inicializar calendario
    initCalendar();
    
    // Configurar eventos
    setupEventListeners();
    
    // Forzar scroll a 0
    forceScrollToTop();
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

        if (isSameDay(currentDay, config.today)) {
            dayElement.classList.add('today');
        }

        if (isSameDay(currentDay, config.selectedDate)) {
            dayElement.classList.add('selected');
        }

        dayElement.addEventListener('click', function () {
            selectDay(currentDay);
        });

        calendarGrid.appendChild(dayElement);
    }
}


// Generar franjas horarias
function generateTimeSlots() {
    const timeSlots = document.getElementById('timeSlots');
    if (!timeSlots) {
        console.error('No se encontró el elemento #timeSlots');
        return;
    }
    
    timeSlots.innerHTML = '';
    
    // Crear un espaciador invisible para asegurar que la primera hora sea visible
    const spacer = document.createElement('div');
    spacer.className = 'time-slot-spacer';
    spacer.style.height = '0';
    spacer.style.padding = '0';
    spacer.style.margin = '0';
    spacer.style.visibility = 'hidden';
    timeSlots.appendChild(spacer);
    
    // Generar franjas hora por hora desde 01:00 hasta 23:00
    for (let hour = 1; hour <= 23; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.style.height = `${config.timeSlotHeight * config.zoomLevel}px`;
        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        
        timeSlot.appendChild(timeLabel);
        timeSlots.appendChild(timeSlot);
    }
    
    console.log('Franjas horarias generadas');
    
    // Forzar scroll a 0 otra vez para asegurarnos
    setTimeout(forceScrollToTop, 10);
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
    // Actualizar mini calendario y fecha mostrada
    updateMonthDisplay();
    updateDayDisplay();
    generateCalendarGrid();
    
    // La vista de día podría necesitar regenerarse según la fecha seleccionada
    // Por ahora, solo aseguramos el scroll
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
    newDate.setDate(newDate.getDate() - 1);
    config.selectedDate = newDate;
    
    // Si cambiamos de mes, actualizar la vista del mes también
    if (newDate.getMonth() !== config.currentMonth.getMonth() || 
        newDate.getFullYear() !== config.currentMonth.getFullYear()) {
        config.currentMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    }
    
    updateCalendarView();
}

// Navegar al día siguiente
function navigateToNextDay() {
    const newDate = new Date(config.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    config.selectedDate = newDate;
    
    // Si cambiamos de mes, actualizar la vista del mes también
    if (newDate.getMonth() !== config.currentMonth.getMonth() || 
        newDate.getFullYear() !== config.currentMonth.getFullYear()) {
        config.currentMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    }
    
    updateCalendarView();
}

// Ir a hoy
function goToToday() {
    config.selectedDate = new Date(config.today);
    config.currentMonth = new Date(config.today.getFullYear(), config.today.getMonth(), 1);
    
    updateCalendarView();
}

// Seleccionar un día específico
function selectDay(date) {
    config.selectedDate = new Date(date);

    if (config.selectedDate.getMonth() !== config.currentMonth.getMonth() ||
        config.selectedDate.getFullYear() !== config.currentMonth.getFullYear()) {
        config.currentMonth = new Date(config.selectedDate.getFullYear(), config.selectedDate.getMonth(), 1);
    }

    updateCalendarView();
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
    
    // Actualizar texto del botón
    const button = document.getElementById('viewTypeDropdown');
    if (button) {
        button.textContent = getViewTypeText(viewType);
    }
    
    // Aquí se implementaría la lógica para cambiar entre vistas
    console.log('Cambiando a vista:', viewType);
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

// Llamada adicional para asegurar scrollTop=0
window.addEventListener('load', function() {
    forceScrollToTop();
    setTimeout(forceScrollToTop, 100);
    setTimeout(forceScrollToTop, 500);
});