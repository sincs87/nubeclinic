// JavaScript principal para NubeClinic

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Auto-cerrar alertas después de 5 segundos
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(function(alert) {
            // Crear un objeto Bootstrap para la alerta y ocultarla
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
    
    // Tooltip de Bootstrap (si se necesita)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Si estamos en la página de pago, añadir evento al botón
    const stripeCheckoutBtn = document.querySelector('a[href*="buy.stripe.com"]');
    if (stripeCheckoutBtn) {
        stripeCheckoutBtn.addEventListener('click', function(e) {
            console.log('Redirigiendo a Stripe Checkout...');
            // Aquí podrías añadir analytics o alguna otra funcionalidad
        });
    }
});