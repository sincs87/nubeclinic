function abrirPopup() {
    document.getElementById("popup").classList.remove("d-none");
}

function cerrarPopup() {
    document.getElementById("popup").classList.add("d-none");
}

function guardarPaciente() {
    const data = {
        nombre: document.getElementById("nombre").value,
        apellidos: document.getElementById("apellidos").value,
        telefono: document.getElementById("telefono").value,
        email: document.getElementById("email").value,
        tipo_paciente: document.getElementById("tipo_paciente").value
    };
    fetch("/pacientes/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) location.reload();
        else alert("Error al guardar el paciente");
    });
}
