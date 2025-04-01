// Inicializar variables de configuración
let config = {
    currentMonth: new Date(2025, 3, 1), // Abril 2025
    selectedDate: new Date(2025, 3, 6), // 6 de abril de 2025
    today: new Date(2025, 3, 1), // Simulación del día actual (1 de abril de 2025)
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
    console.log("Inicializando calendario...");
    initializeCalendar();
    setupEventListeners();
    
    // Forzar el scroll a la parte superior para mostrar 01:00
    setTimeout(forceScrollToTop, 100);
});

// Forzar el scroll a la parte superior
function forceScrollToTop() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (calendarGrid) {
        console.log("Estableciendo scroll a 0");
        calendarGrid.scrollTop = 0;
    }
}

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
    console.log("Actualizando visualización del mes");
    updateMonthDisplay();
    
    console.log("Generando la cuadrícula del calendario");
    generateCalendarGrid();
    
    console.log("Actualizando visualización del día");
    updateDayDisplay();
    
    console.log("Generando franjas horarias");
    generateTimeSlots();
}

// Generar la cuadrícula del mini calendario
function generateCalendarGrid() {
    console.log("Generando cuadrícula del calendario para", config.currentMonth);
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Obtener el año y mes actual de visualización
    const year = config.currentMonth.getFullYear();
    const month = config.currentMonth.getMonth();
    
    // Obtener el primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Determinar el primer día que mostraremos (puede ser del mes anterior)
    const firstDayToShow = new Date(firstDayOfMonth);
    // Si el primer día del mes es domingo (0), retroceder 6 días, sino retroceder los días hasta llegar a lunes
    firstDayToShow.setDate(firstDayToShow.getDate() - (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1));
    
    // Mostrar 6 semanas (42 días) para asegurar que tengamos suficiente espacio
    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(firstDayToShow);
        currentDay.setDate(firstDayToShow.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'mini-calendar-day';
        dayElement.textContent = currentDay.getDate();
        
        // Verificar si es del mes actual o de otros meses
        if (currentDay.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        // Verificar si es el día seleccionado
        if (isSameDay(currentDay, config.selectedDate)) {
            console.log("Día seleccionado:", currentDay);
            dayElement.classList.add('selected');
        }
        
        // Verificar si es el día actual
        if (isSameDay(currentDay, config.today)) {
            console.log("Día actual:", currentDay);
            dayElement.classList.add('today');
        }
        
        // Configurar el click en el día
        dayElement.addEventListener('click', function() {
            console.log("Día seleccionado:", currentDay);
            selectDay(currentDay);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Generar las franjas horarias
function generateTimeSlots() {
    console.log("Generando franjas horarias");
    
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';
    
    // Crear slots desde la 1:00 hasta las 23:00
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
    
    // Forzar el scroll a la parte superior nuevamente
    setTimeout(forceScrollToTop, 50);
}

// Actualizar la visualización del mes actual
function updateMonthDisplay() {
    const monthYear = `${months[config.currentMonth.getMonth()]} ${config.currentMonth.getFullYear()}`;
    document.getElementById('currentMonth').textContent = monthYear;
}

// Actualizar la visualización del día seleccionado
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
    console.log("Actualizando toda la vista del calendario");
    updateMonthDisplay();
    generateCalendarGrid();
    updateDayDisplay();
    generateTimeSlots();
}

// Navegación del mes
function navigateToPreviousMonth() {
    console.log("Navegando al mes anterior");
    const newMonth = new Date(config.currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    config.currentMonth = newMonth;
    updateMonthDisplay();
    generateCalendarGrid();
}

function navigateToNextMonth() {
    console.log("Navegando al mes siguiente");
    const newMonth = new Date(config.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    config.currentMonth = newMonth;
    updateMonthDisplay();
    generateCalendarGrid();
}

// Navegación del día
function navigateToPreviousDay() {
    console.log("Navegando al día anterior");
    const newDate = new Date(config.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    config.selectedDate = newDate;
    
    // Verificar si necesitamos cambiar el mes visible
    if (config.selectedDate.getMonth() !== config.currentMonth.getMonth()) {
        config.currentMonth = new Date(config.selectedDate.getFullYear(), config.selectedDate.getMonth(), 1);
    }
    
    updateDayDisplay();
    updateCalendarView();
}

function navigateToNextDay() {
    console.log("Navegando al día siguiente");
    const newDate = new Date(config.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    config.selectedDate = newDate;
    
    // Verificar si necesitamos cambiar el mes visible
    if (config.selectedDate.getMonth() !== config.currentMonth.getMonth()) {
        config.currentMonth = new Date(config.selectedDate.getFullYear(), config.selectedDate.getMonth(), 1);
    }
    
    updateDayDisplay();
    updateCalendarView();
}

function goToToday() {
    console.log("Navegando al día actual");
    config.selectedDate = new Date(config.today);
    config.currentMonth = new Date(config.today.getFullYear(), config.today.getMonth(), 1);
    updateCalendarView();
}

// Función para seleccionar un día específico
function selectDay(date) {
    console.log("Seleccionando día:", date);
    
    // Establecer la fecha seleccionada
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

// Cambiar el tipo de vista
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