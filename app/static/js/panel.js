// Inicializar variables de configuración
let config = {
    currentDate: new Date(2025, 3, 6), // 6 de abril de 2025 (para el calendario del mes)
    selectedDate: new Date(2025, 3, 6), // Fecha seleccionada inicialmente
    today: new Date(2025, 3, 1), // Día actual real (para marcar hoy) - Simulamos que "hoy" es el 1 de abril
    viewType: 'day',
    timeSlotHeight: 60,
    zoomLevel: 1,
    hideAppointments: false,
    divideViewByCalendars: false
};

// Meses en español
const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 
    'Mayo', 'Junio', 'Julio', 'Agosto', 
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Días de la semana en español
const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupEventListeners();
    
    // Asegurar que el calendario principal comience mostrando las 01:00
    setTimeout(() => {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (calendarGrid) {
            calendarGrid.scrollTop = 0;
        }
    }, 100);
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Navegación del mes
    document.getElementById('prevMonth').addEventListener('click', navigateToPreviousMonth);
    document.getElementById('nextMonth').addEventListener('click', navigateToNextMonth);
    
    // Navegación del día
    document.getElementById('prevDay').addEventListener('click', navigateToPreviousDay);
    document.getElementById('nextDay').addEventListener('click', navigateToNextDay);
    document.getElementById('goToToday').addEventListener('click', goToToday);
    
    // Zoom de calendario
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    
    // Cambio de tipo de vista
    document.querySelectorAll('.view-type-menu .dropdown-item[data-view]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            changeViewType(this.getAttribute('data-view'));
        });
    });
    
    // Toggles de opciones
    document.getElementById('hideAppointments').addEventListener('change', function() {
        config.hideAppointments = this.checked;
        updateCalendarView();
    });
    
    document.getElementById('divideView').addEventListener('change', function() {
        config.divideViewByCalendars = this.checked;
        updateCalendarView();
    });
}

// Inicializar el calendario
function initializeCalendar() {
    updateMonthDisplay();
    generateCalendarGrid();
    generateTimeSlots();
    updateDayDisplay();
}

// Generar la cuadrícula del mini calendario
function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    const year = config.currentDate.getFullYear();
    const month = config.currentDate.getMonth();
    
    // Obtener el primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Determinar el primer día que mostraremos (puede ser del mes anterior)
    const firstDayToShow = new Date(firstDayOfMonth);
    firstDayToShow.setDate(firstDayToShow.getDate() - (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1));
    
    // Mostrar 6 semanas (42 días) para asegurar que tengamos suficiente espacio
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(firstDayToShow);
        currentDate.setDate(firstDayToShow.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'mini-calendar-day';
        dayElement.textContent = currentDate.getDate();
        
        // Verificar si es del mes actual o de otros meses
        if (currentDate.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        // Verificar si es el día seleccionado actualmente
        if (isSameDay(currentDate, config.selectedDate)) {
            dayElement.classList.add('selected');
        }
        
        // Verificar si es el día actual real ("hoy")
        if (isSameDay(currentDate, config.today)) {
            dayElement.classList.add('today');
        }
        
        // Configurar el click en el día
        dayElement.addEventListener('click', function() {
            selectDay(currentDate);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Generar las franjas horarias
function generateTimeSlots() {
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';
    
    // Generar slots desde la 1:00 hasta las 23:00
    for (let hour = 1; hour <= 23; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.style.height = `${config.timeSlotHeight * config.zoomLevel}px`;
        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        
        timeSlot.appendChild(timeLabel);
        timeSlotsContainer.appendChild(timeSlot);
    }
}

// Actualizar la visualización del mes actual
function updateMonthDisplay() {
    const monthYear = `${months[config.currentDate.getMonth()]} ${config.currentDate.getFullYear()}`;
    document.getElementById('currentMonth').textContent = monthYear;
}

// Actualizar la visualización del día actual
function updateDayDisplay() {
    const dayOfWeek = weekdays[config.selectedDate.getDay()];
    const day = config.selectedDate.getDate();
    const month = months[config.selectedDate.getMonth()].toLowerCase().substring(0, 3);
    const year = config.selectedDate.getFullYear();
    
    const formattedDate = `${dayOfWeek}., ${day} de ${month} de ${year}`;
    document.getElementById('currentDay').textContent = formattedDate;
}

// Actualizar toda la vista del calendario
function updateCalendarView() {
    updateMonthDisplay();
    generateCalendarGrid();
    updateDayDisplay();
    generateTimeSlots();
}

// Funciones de navegación
function navigateToPreviousMonth() {
    config.currentDate = new Date(config.currentDate.getFullYear(), config.currentDate.getMonth() - 1, 1);
    updateMonthDisplay();
    generateCalendarGrid();
}

function navigateToNextMonth() {
    config.currentDate = new Date(config.currentDate.getFullYear(), config.currentDate.getMonth() + 1, 1);
    updateMonthDisplay();
    generateCalendarGrid();
}

function navigateToPreviousDay() {
    const newDate = new Date(config.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    config.selectedDate = newDate;
    
    // Si el día seleccionado ya no está en el mes actual, actualizamos el mes
    if (config.selectedDate.getMonth() !== config.currentDate.getMonth()) {
        config.currentDate = new Date(config.selectedDate.getFullYear(), config.selectedDate.getMonth(), 1);
    }
    
    updateDayDisplay();
    updateCalendarView();
}

function navigateToNextDay() {
    const newDate = new Date(config.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    config.selectedDate = newDate;
    
    // Si el día seleccionado ya no está en el mes actual, actualizamos el mes
    if (config.selectedDate.getMonth() !== config.currentDate.getMonth()) {
        config.currentDate = new Date(config.selectedDate.getFullYear(), config.selectedDate.getMonth(), 1);
    }
    
    updateDayDisplay();
    updateCalendarView();
}

function goToToday() {
    config.selectedDate = new Date(config.today);
    config.currentDate = new Date(config.today.getFullYear(), config.today.getMonth(), 1);
    updateCalendarView();
}

// Función para seleccionar un día específico
function selectDay(date) {
    // Establecer la fecha seleccionada (hacemos copia para evitar problemas de referencia)
    config.selectedDate = new Date(date);
    
    // Actualizar la vista
    updateDayDisplay();
    updateCalendarView();
}

// Funciones de zoom
function zoomIn() {
    if (config.zoomLevel < 2) {
        config.zoomLevel += 0.25;
        generateTimeSlots();
    }
}

function zoomOut() {
    if (config.zoomLevel > 0.5) {
        config.zoomLevel -= 0.25;
        generateTimeSlots();
    }
}

// Cambiar el tipo de vista (día, semana, mes, etc.)
function changeViewType(viewType) {
    config.viewType = viewType;
    document.getElementById('viewTypeDropdown').textContent = getViewTypeText(viewType);
    updateCalendarView();
}

// Obtener el texto para el tipo de vista
function getViewTypeText(viewType) {
    switch (viewType) {
        case 'list': return 'Lista de citas';
        case 'day': return 'Día';
        case 'week': return 'Semana';
        case 'hours': return 'Horas disponibles';
        default: return 'Día';
    }
}

// Función auxiliar para comprobar si dos fechas son el mismo día
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
}