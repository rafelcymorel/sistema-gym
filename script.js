let clientes = [];
let fiados = [];
let pagosMembresia = [];

let seccionActual = "todos";
let clienteEditandoId = null;
let clientePagoId = null;


// =====================================
// ALMACENAMIENTO
// =====================================

function guardarDatos() {
    localStorage.setItem("clientesGym", JSON.stringify(clientes));
    localStorage.setItem("fiadosGym", JSON.stringify(fiados));
    localStorage.setItem("pagosMembresiaGym", JSON.stringify(pagosMembresia));
}

function cargarDatos() {
    try {
        const c = JSON.parse(localStorage.getItem("clientesGym") || "[]");
        const f = JSON.parse(localStorage.getItem("fiadosGym") || "[]");
        const p = JSON.parse(localStorage.getItem("pagosMembresiaGym") || "[]");

        clientes = Array.isArray(c) ? c : [];
        fiados = Array.isArray(f) ? f : [];
        pagosMembresia = Array.isArray(p) ? p : [];
    } catch (error) {
        console.error("Error cargando datos:", error);
        alert("No se pudieron leer algunos datos guardados. No borres el almacenamiento del navegador.");
    }

    // Compatibilidad con registros creados en versiones anteriores.
    clientes = clientes.map(function(cliente) {
        return {
            ...cliente,
            id: cliente.id ?? Date.now() + Math.random(),
            precio: Number(cliente.precio) || 0,
            pagado: Number(cliente.pagado) || 0
        };
    });

    fiados = fiados.map(function(fiado) {
        return {
            ...fiado,
            id: fiado.id ?? Date.now() + Math.random(),
            monto: Number(fiado.monto) || 0,
            pagado: Boolean(fiado.pagado),
            fechaPago: fiado.fechaPago || null
        };
    });
}


// =====================================
// UTILIDADES
// =====================================

function obtenerFechaHoy() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function dinero(valor) {
    return Number(valor || 0).toLocaleString("es-DO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function seguro(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, function(caracter) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[caracter];
    });
}

function obtenerEstado(fechaVencimiento) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vencimiento = new Date(fechaVencimiento + "T00:00:00");
    const dias = Math.ceil((vencimiento - hoy) / 86400000);

    if (dias < 0) return { texto: "🔴 Vencida", clase: "vencida" };
    if (dias <= 7) return { texto: "🟡 Por vencer", clase: "por-vencer" };

    return { texto: "🟢 Activa", clase: "activa" };
}


// =====================================
// CLIENTES: AGREGAR Y EDITAR
// =====================================

function abrirFormulario() {
    clienteEditandoId = null;

    document.getElementById("formCliente").reset();
    document.getElementById("tituloFormularioCliente").textContent = "➕ Agregar cliente";
    document.getElementById("btnGuardarCliente").textContent = "💾 Guardar cliente";
    document.getElementById("fechaInicio").value = obtenerFechaHoy();
    document.getElementById("modalCliente").style.display = "flex";
}

function cerrarFormulario() {
    document.getElementById("modalCliente").style.display = "none";
    clienteEditandoId = null;
}

function guardarCliente(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const tipoMembresia = document.getElementById("tipoMembresia").value;
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaVencimiento = document.getElementById("fechaVencimiento").value;
    const precio = Number(document.getElementById("precio").value);
    const pagado = Number(document.getElementById("pagado").value);

    if (!nombre || !telefono || !tipoMembresia || !fechaInicio || !fechaVencimiento) {
        alert("Completa todos los campos.");
        return;
    }

    if (fechaVencimiento < fechaInicio) {
        alert("La fecha de vencimiento no puede ser anterior al inicio.");
        return;
    }

    if (!Number.isFinite(precio) || !Number.isFinite(pagado) || precio < 0 || pagado < 0) {
        alert("Revisa los montos.");
        return;
    }

    if (pagado > precio && !confirm("El monto pagado supera el precio. ¿Guardar de todas formas?")) {
        return;
    }

    if (clienteEditandoId !== null) {
        const indice = clientes.findIndex(c => c.id === clienteEditandoId);

        if (indice === -1) {
            alert("No encontramos ese cliente.");
            cerrarFormulario();
            return;
        }

        const clienteAnterior = clientes[indice];
        const diferenciaPrecio = precio - Number(clienteAnterior.precio);
        const nuevoPagado = Math.max(0, Number(clienteAnterior.pagado) + diferenciaPrecio);

        clientes[indice] = {
            ...clienteAnterior,
            nombre,
            telefono,
            tipoMembresia,
            fechaInicio,
            fechaVencimiento,
            precio,
            pagado: Math.min(precio, nuevoPagado)
        };

        guardarDatos();
        cerrarFormulario();
        actualizarPantalla();
        alert("Cliente actualizado correctamente ✏️");
        return;
    }

    clientes.push({
        id: Date.now(),
        nombre,
        telefono,
        tipoMembresia,
        fechaInicio,
        fechaVencimiento,
        precio,
        pagado
    });

    guardarDatos();
    cerrarFormulario();
    actualizarPantalla();
    alert("Cliente guardado correctamente 💗");
}

function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return alert("No encontramos ese cliente.");

    clienteEditandoId = id;

    document.getElementById("nombre").value = cliente.nombre;
    document.getElementById("telefono").value = cliente.telefono;
    document.getElementById("tipoMembresia").value = cliente.tipoMembresia;
    document.getElementById("fechaInicio").value = cliente.fechaInicio;
    document.getElementById("fechaVencimiento").value = cliente.fechaVencimiento;
    document.getElementById("precio").value = cliente.precio;
    document.getElementById("pagado").value = cliente.pagado;

    document.getElementById("tituloFormularioCliente").textContent = "✏️ Editar cliente";
    document.getElementById("btnGuardarCliente").textContent = "💾 Guardar cambios";
    document.getElementById("modalCliente").style.display = "flex";
}

function eliminarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    if (!confirm(`¿Seguro que deseas eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) {
        return;
    }

    clientes = clientes.filter(c => c.id !== id);

    guardarDatos();
    actualizarPantalla();
    alert("Cliente eliminado.");
}


// =====================================
// MOSTRAR CLIENTES
// =====================================

function mostrarClientes() {
    const lista = document.getElementById("listaClientes");
    lista.innerHTML = "";

    const busqueda = document.getElementById("buscarCliente").value.trim().toLowerCase();

    let mostrar = clientes.filter(function(cliente) {
        const estado = obtenerEstado(cliente.fechaVencimiento);

        if (seccionActual === "activas") return estado.clase === "activa";
        if (seccionActual === "por-vencer") return estado.clase === "por-vencer";
        if (seccionActual === "vencidas") return estado.clase === "vencida";
        if (seccionActual === "deudas") return Number(cliente.precio) > Number(cliente.pagado);

        return true;
    });

    if (busqueda) {
        mostrar = mostrar.filter(c =>
            c.nombre.toLowerCase().includes(busqueda) ||
            c.telefono.toLowerCase().includes(busqueda)
        );
    }

    if (mostrar.length === 0) {
        lista.innerHTML = `<div class="sin-clientes"><span>👥</span><p>No hay clientes en esta sección.</p></div>`;
        return;
    }

    mostrar.forEach(function(cliente) {
        const estado = obtenerEstado(cliente.fechaVencimiento);
        const deuda = Math.max(0, Number(cliente.precio) - Number(cliente.pagado));

        const accionesPago = deuda > 0
            ? `<button class="btn-pago" onclick="abrirFormularioPago(${cliente.id})">💰 Registrar pago</button>`
            : `<small>✅ Sin deuda</small>`;

        const elemento = document.createElement("div");
        elemento.className = "cliente";

        elemento.innerHTML = `
            <div>
                <div class="cliente-nombre">${seguro(cliente.nombre)}</div>
                <div class="cliente-telefono">📞 ${seguro(cliente.telefono)}</div>
                <div class="cliente-acciones">
                    <button class="btn-editar" onclick="editarCliente(${cliente.id})">✏️ Editar</button>
                    <button class="btn-eliminar" onclick="eliminarCliente(${cliente.id})">🗑️ Eliminar</button>
                </div>
            </div>

            <div class="cliente-info">
                <strong>Membresía</strong><br>${seguro(cliente.tipoMembresia)}
            </div>

            <div class="cliente-info">
                <strong>Inicio</strong><br>${seguro(cliente.fechaInicio)}
            </div>

            <div class="cliente-info">
                <strong>Vence</strong><br>${seguro(cliente.fechaVencimiento)}
            </div>

            <div class="cliente-info">
                <strong>Precio</strong><br>RD$ ${dinero(cliente.precio)}
                <br><small>Pagado: RD$ ${dinero(cliente.pagado)}</small>
            </div>

            <div>
                <span class="estado ${estado.clase}">${estado.texto}</span>
                <br><small>${deuda > 0 ? `Debe RD$ ${dinero(deuda)}` : "Pagado completo"}</small>
                <br>${accionesPago}
            </div>
        `;

        lista.appendChild(elemento);
    });
}


// =====================================
// PAGOS DE MEMBRESÍA
// =====================================

function abrirFormularioPago(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    const deuda = Number(cliente.precio) - Number(cliente.pagado);
    if (deuda <= 0) return alert("Este cliente no tiene deuda pendiente.");

    clientePagoId = id;

    document.getElementById("formPago").reset();
    document.getElementById("nombrePago").value = cliente.nombre;
    document.getElementById("deudaPago").value = "RD$ " + dinero(deuda);
    document.getElementById("montoPago").max = deuda;
    document.getElementById("fechaPago").value = obtenerFechaHoy();
    document.getElementById("modalPago").style.display = "flex";
}

function cerrarFormularioPago() {
    document.getElementById("modalPago").style.display = "none";
    clientePagoId = null;
}

function guardarPago(event) {
    event.preventDefault();

    const cliente = clientes.find(c => c.id === clientePagoId);
    if (!cliente) return alert("No encontramos al cliente.");

    const monto = Number(document.getElementById("montoPago").value);
    const fecha = document.getElementById("fechaPago").value;
    const deuda = Number(cliente.precio) - Number(cliente.pagado);

    if (!Number.isFinite(monto) || monto <= 0) {
        alert("Introduce un monto válido.");
        return;
    }

    if (monto > deuda) {
        alert("El pago no puede superar la deuda pendiente.");
        return;
    }

    cliente.pagado = Number(cliente.pagado) + monto;

    pagosMembresia.push({
        id: Date.now(),
        clienteId: cliente.id,
        nombre: cliente.nombre,
        monto,
        fecha
    });

    guardarDatos();
    cerrarFormularioPago();
    actualizarPantalla();

    alert("Pago registrado correctamente 💰");
}

function mostrarHistorialPagos() {
    const contenedor = document.getElementById("contenedorPagos");
    contenedor.innerHTML = "";

    const busqueda = document.getElementById("buscarCliente").value.trim().toLowerCase();

    const pagos = pagosMembresia.filter(p =>
        p.nombre.toLowerCase().includes(busqueda)
    ).slice().reverse();

    if (pagos.length === 0) {
        contenedor.innerHTML = `<div class="sin-clientes"><span>💰</span><p>No hay pagos de membresía registrados todavía.</p></div>`;
        return;
    }

    pagos.forEach(function(pago) {
        const fila = document.createElement("div");
        fila.className = "pago-registro";

        fila.innerHTML = `
            <div><strong>${seguro(pago.nombre)}</strong></div>
            <div>💰 RD$ ${dinero(pago.monto)}</div>
            <div>📅 ${seguro(pago.fecha)}</div>
            <div>🟢 Pago registrado</div>
        `;

        contenedor.appendChild(fila);
    });
}


// =====================================
// MENÚ Y SECCIONES
// =====================================

function mostrarSeccion(seccion) {
    seccionActual = seccion;

    document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("activo"));

    const mapa = {
        todos: 0,
        activas: 1,
        "por-vencer": 2,
        vencidas: 3,
        deudas: 4,
        fiados: 5,
        historial: 6,
        pagos: 7
    };

    const botones = document.querySelectorAll(".menu-btn");
    if (mapa[seccion] !== undefined) botones[mapa[seccion]].classList.add("activo");

    const listaClientes = document.getElementById("listaClientes");
    const listaFiados = document.getElementById("listaFiados");
    const listaPagos = document.getElementById("listaPagos");

    const resumenFiados = document.getElementById("resumenFiados");
    const btnNuevoFiado = document.getElementById("btnNuevoFiado");

    listaClientes.style.display = "none";
    listaFiados.style.display = "none";
    listaPagos.style.display = "none";

    if (seccion === "fiados" || seccion === "historial") {
        document.getElementById("tituloSeccion").textContent =
            seccion === "fiados" ? "🧾 Fiados pendientes" : "📜 Historial de fiados";

        document.getElementById("descripcionSeccion").textContent =
            seccion === "fiados"
                ? "Deudas independientes de las membresías."
                : "Fiados que ya fueron pagados.";

        listaFiados.style.display = "block";
        resumenFiados.style.display = seccion === "fiados" ? "grid" : "none";
        btnNuevoFiado.style.display = seccion === "fiados" ? "inline-block" : "none";

        if (seccion === "fiados") mostrarFiados();
        else mostrarHistorialFiados();

        return;
    }

    if (seccion === "pagos") {
        document.getElementById("tituloSeccion").textContent = "💰 Pagos de membresías";
        document.getElementById("descripcionSeccion").textContent = "Historial de pagos registrados.";
        listaPagos.style.display = "block";
        mostrarHistorialPagos();
        return;
    }

    const textos = {
        todos: ["Todos los clientes", "Personas registradas en el gimnasio."],
        activas: ["🟢 Membresías activas", "Clientes con membresía activa."],
        "por-vencer": ["🟡 Membresías por vencer", "Membresías que vencen en 7 días o menos."],
        vencidas: ["🔴 Membresías vencidas", "Clientes cuya membresía ya venció."],
        deudas: ["💳 Deudas de membresías", "Clientes que todavía deben parte de su membresía."]
    };

    if (textos[seccion]) {
        document.getElementById("tituloSeccion").textContent = textos[seccion][0];
        document.getElementById("descripcionSeccion").textContent = textos[seccion][1];
    }

    listaClientes.style.display = "flex";
    mostrarClientes();
}

function buscarClientes() {
    if (seccionActual === "fiados") mostrarFiados();
    else if (seccionActual === "historial") mostrarHistorialFiados();
    else if (seccionActual === "pagos") mostrarHistorialPagos();
    else mostrarClientes();
}


// =====================================
// ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {
    let activas = 0;
    let porVencer = 0;
    let vencidas = 0;
    let deudas = 0;

    clientes.forEach(function(cliente) {
        const estado = obtenerEstado(cliente.fechaVencimiento);

        if (estado.clase === "activa") activas++;
        if (estado.clase === "por-vencer") porVencer++;
        if (estado.clase === "vencida") vencidas++;

        if (Number(cliente.precio) > Number(cliente.pagado)) deudas++;
    });

    document.getElementById("totalActivas").textContent = activas;
    document.getElementById("totalPorVencer").textContent = porVencer;
    document.getElementById("totalVencidas").textContent = vencidas;
    document.getElementById("totalDeudas").textContent = deudas;
}


// =====================================
// FIADOS
// =====================================

function abrirFormularioFiado() {
    document.getElementById("formFiado").reset();
    document.getElementById("fechaFiado").value = obtenerFechaHoy();
    document.getElementById("modalFiado").style.display = "flex";
}

function cerrarFormularioFiado() {
    document.getElementById("modalFiado").style.display = "none";
}

function guardarFiado(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombreFiado").value.trim();
    const concepto = document.getElementById("conceptoFiado").value.trim();
    const monto = Number(document.getElementById("montoFiado").value);
    const fecha = document.getElementById("fechaFiado").value;

    if (!nombre || !concepto || !fecha || !Number.isFinite(monto) || monto <= 0) {
        alert("Revisa los datos del fiado.");
        return;
    }

    fiados.push({
        id: Date.now(),
        nombre,
        concepto,
        monto,
        fecha,
        pagado: false,
        fechaPago: null
    });

    guardarDatos();
    cerrarFormularioFiado();
    mostrarFiados();

    alert("Fiado guardado correctamente 🧾");
}

function mostrarFiados() {
    const contenedor = document.getElementById("contenedorFiados");
    contenedor.innerHTML = "";

    const busqueda = document.getElementById("buscarCliente").value.trim().toLowerCase();

    const pendientes = fiados.filter(f =>
        !f.pagado &&
        (f.nombre.toLowerCase().includes(busqueda) ||
         f.concepto.toLowerCase().includes(busqueda))
    );

    const total = pendientes.reduce((suma, f) => suma + Number(f.monto), 0);

    document.getElementById("cantidadFiados").textContent = pendientes.length;
    document.getElementById("totalFiado").textContent = "RD$ " + dinero(total);

    if (pendientes.length === 0) {
        contenedor.innerHTML = `<div class="sin-fiados"><span>🧾</span><p>No tienes fiados pendientes.</p></div>`;
        return;
    }

    pendientes.forEach(function(fiado) {
        const elemento = document.createElement("div");
        elemento.className = "fiado";

        elemento.innerHTML = `
            <div class="fiado-nombre">${seguro(fiado.nombre)}</div>
            <div class="fiado-concepto">${seguro(fiado.concepto)}</div>
            <div class="fiado-monto">RD$ ${dinero(fiado.monto)}</div>
            <div class="fiado-fecha">Fecha: ${seguro(fiado.fecha)}</div>
            <div class="acciones-fiado">
                <button class="btn-pagado" onclick="marcarFiadoPagado(${fiado.id})">✅ Pagado</button>
                <button class="btn-eliminar-fiado" onclick="eliminarFiado(${fiado.id})">🗑️ Eliminar</button>
            </div>
        `;

        contenedor.appendChild(elemento);
    });
}

function marcarFiadoPagado(id) {
    const fiado = fiados.find(f => f.id === id);
    if (!fiado) return;

    if (!confirm(`¿Confirmas que ${fiado.nombre} pagó RD$ ${dinero(fiado.monto)}?`)) return;

    fiado.pagado = true;
    fiado.fechaPago = obtenerFechaHoy();

    guardarDatos();
    mostrarFiados();

    alert("Fiado marcado como pagado ✅");
}

function mostrarHistorialFiados() {
    const contenedor = document.getElementById("contenedorFiados");
    contenedor.innerHTML = "";

    const busqueda = document.getElementById("buscarCliente").value.trim().toLowerCase();

    const historial = fiados.filter(f =>
        f.pagado &&
        (f.nombre.toLowerCase().includes(busqueda) ||
         f.concepto.toLowerCase().includes(busqueda))
    );

    if (historial.length === 0) {
        contenedor.innerHTML = `<div class="sin-fiados"><span>📜</span><p>No hay fiados pagados que mostrar.</p></div>`;
        return;
    }

    historial.slice().reverse().forEach(function(fiado) {
        const elemento = document.createElement("div");
        elemento.className = "fiado";

        elemento.innerHTML = `
            <div>
                <div class="fiado-nombre">${seguro(fiado.nombre)}</div>
                <small>🟢 Pagado</small>
            </div>
            <div class="fiado-concepto">${seguro(fiado.concepto)}</div>
            <div class="fiado-monto">RD$ ${dinero(fiado.monto)}</div>
            <div class="fiado-fecha">
                Fiado: ${seguro(fiado.fecha)}<br>
                Pagado: ${seguro(fiado.fechaPago || "—")}
            </div>
            <div>
                <button class="btn-eliminar-fiado" onclick="eliminarFiado(${fiado.id})">🗑️ Eliminar</button>
            </div>
        `;

        contenedor.appendChild(elemento);
    });
}

function eliminarFiado(id) {
    const fiado = fiados.find(f => f.id === id);
    if (!fiado) return;

    if (!confirm(`¿Quieres eliminar el registro de ${fiado.nombre}?`)) return;

    fiados = fiados.filter(f => f.id !== id);

    guardarDatos();

    if (seccionActual === "historial") mostrarHistorialFiados();
    else mostrarFiados();
}


// =====================================
// ACTUALIZAR PANTALLA
// =====================================

function actualizarPantalla() {
    actualizarEstadisticas();

    if (seccionActual === "fiados") mostrarFiados();
    else if (seccionActual === "historial") mostrarHistorialFiados();
    else if (seccionActual === "pagos") mostrarHistorialPagos();
    else mostrarClientes();
}


// =====================================
// INICIAR
// =====================================

cargarDatos();
actualizarPantalla();