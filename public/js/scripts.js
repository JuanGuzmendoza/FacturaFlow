// =======================================================
// JAVASCRIPT DEL FRONTEND - INTERACTIVIDAD Y VALIDACIÓN
// =======================================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Confirmación de Eliminación para Formularios
    const formulariosEliminar = document.querySelectorAll('.form-eliminar');
    
    formulariosEliminar.forEach(formulario => {
        formulario.addEventListener('submit', function(evento) {
            // Evitamos el envío automático del formulario
            evento.preventDefault();
            
            // Intentar obtener el código de la factura para personalizar el mensaje
            const numeroFactura = this.getAttribute('data-factura') || '';
            const mensaje = numeroFactura 
                ? `¿Estás seguro de que deseas eliminar la factura "${numeroFactura}"?\n\nEsta acción es permanente y no se puede deshacer.`
                : '¿Estás seguro de que deseas eliminar este registro?\n\nEsta acción es permanente y no se puede deshacer.';
            
            // Mostrar ventana emergente de confirmación nativa
            const confirmado = confirm(mensaje);
            
            // Si el usuario confirma, procedemos con el envío
            if (confirmado) {
                this.submit();
            }
        });
    });

    // 2. Validación de Formulario (Validaciones del Navegador con Estilo Bootstrap)
    const formulariosValidar = document.querySelectorAll('.needs-validation');
    
    formulariosValidar.forEach(formulario => {
        formulario.addEventListener('submit', function(evento) {
            if (!formulario.checkValidity()) {
                evento.preventDefault();
                evento.stopPropagation();
            }
            formulario.classList.add('was-validated');
        }, false);
    });

    // =======================================================
    // 3. MEJORAR Y PROFESIONALIZAR DESCRIPCIÓN CON IA (FORMULARIO)
    // =======================================================
    const btnGenerar = document.getElementById('btn-generar-descripcion');
    const iaStatus = document.getElementById('ia-status-msg');

    if (btnGenerar) {
        btnGenerar.addEventListener('click', async () => {
            const empresaId = document.getElementById('empresa_id').value;
            const monto = document.getElementById('monto').value;
            const fechaPago = document.getElementById('fecha_pago').value;
            const descripcionTxt = document.getElementById('descripcion');
            const descripcionVal = descripcionTxt.value.trim();

            // Validar que se hayan ingresado los campos necesarios
            if (!empresaId || !monto || !fechaPago) {
                alert('Por favor, selecciona una Empresa y completa el Monto y la Fecha de Pago antes de usar la IA.');
                return;
            }

            // Validar que haya un borrador para mejorar
            if (!descripcionVal) {
                alert('Por favor, escribe un borrador en la descripción antes de usar la IA para mejorarla.');
                return;
            }

            // Cambiar apariencia del botón a estado de carga
            btnGenerar.disabled = true;
            btnGenerar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mejorando...';
            iaStatus.style.display = 'block';
            iaStatus.className = 'form-text text-info animate-pulse';
            iaStatus.innerHTML = '<i class="bi bi-cpu"></i> Groq está puliendo tu borrador para hacerlo más profesional...';

            try {
                const respuesta = await fetch('/facturas/generar-descripcion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        empresa_id: empresaId,
                        monto: monto,
                        fecha_pago: fechaPago,
                        descripcion: descripcionVal
                    })
                });

                const data = await respuesta.json();

                if (data.success) {
                    descripcionTxt.value = data.descripcion;
                    iaStatus.className = 'form-text text-success';
                    iaStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i> Descripción mejorada con éxito.';
                } else {
                    iaStatus.className = 'form-text text-danger';
                    iaStatus.innerText = data.mensaje || 'Error al comunicarse con la IA.';
                }
            } catch (err) {
                console.error('Error AJAX en mejora de descripción:', err);
                iaStatus.className = 'form-text text-danger';
                iaStatus.innerText = 'Error de conexión con el servidor.';
            } finally {
                // Restablecer botón
                btnGenerar.disabled = false;
                btnGenerar.innerHTML = '<i class="bi bi-magic text-info"></i> Mejorar con IA';
            }
        });
    }

    // =======================================================
    // 4. LÓGICA DE MENSAJERÍA DEL CHATBOT INTELIGENTE CON MEMORIA
    // =======================================================
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('messages-container');
    const chatLoading = document.getElementById('chat-loading');
    const chatBody = document.getElementById('chat-body');
    const suggestions = document.querySelectorAll('.btn-suggestion');

    if (chatForm) {
        // Historial de conversación guardado localmente en el cliente (Memoria de chat)
        const historialConversacion = [];
        
        // Enviar consulta al backend
        const enviarPregunta = async (preguntaText) => {
            // 1. Agregar burbuja de texto del usuario
            agregarBurbuja(preguntaText, 'user', 'Tú');
            
            // Ocultar sugerencias después del primer mensaje enviado
            const sugContainer = document.getElementById('suggestions-container');
            if (sugContainer) {
                sugContainer.style.display = 'none';
            }

            // Mostrar el estado de carga
            chatLoading.style.display = 'block';
            desplazarAbajo();

            try {
                const respuesta = await fetch('/chatbot/pregunta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        pregunta: preguntaText,
                        historial: historialConversacion
                    })
                });

                const data = await respuesta.json();

                // Quitar indicador de carga
                chatLoading.style.display = 'none';

                if (data.success) {
                    // Agregar burbuja del bot con el SQL utilizado
                    agregarBurbuja(data.respuesta, 'bot', 'FacturaBot', data.sql_ejecutado);
                    
                    // Almacenar el mensaje del usuario y la respuesta de la IA en la memoria local
                    historialConversacion.push({ role: 'user', content: preguntaText });
                    historialConversacion.push({ role: 'assistant', content: data.respuesta });
                } else {
                    agregarBurbuja(data.respuesta || 'Lo siento, no pude procesar tu solicitud.', 'bot', 'FacturaBot', data.sql_ejecutado);
                }

            } catch (error) {
                console.error('Error AJAX en el chat:', error);
                chatLoading.style.display = 'none';
                agregarBurbuja('Tuve un error al conectar con el servidor local. Asegúrate de tener Node corriendo.', 'bot', 'FacturaBot');
            }
            
            desplazarAbajo();
        };

        // Escuchar envío del formulario de chat
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pregunta = chatInput.value.trim();
            if (pregunta) {
                enviarPregunta(pregunta);
                chatInput.value = ''; // Limpiar el input
            }
        });

        // Escuchar clics en los botones de sugerencia rápida
        suggestions.forEach(boton => {
            boton.addEventListener('click', () => {
                const textoPregunta = boton.innerText.trim();
                enviarPregunta(textoPregunta);
            });
        });

        // Función dinámica para insertar burbujas en el chat
        function agregarBurbuja(contenido, remitente, nombre, sqlEjecutado = null) {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.className = `chat-message ${remitente} mt-3`;
            
            let htmlBurbuja = `
                <div class="chat-bubble">
                    ${contenido.replace(/\n/g, '<br>')}
            `;

            // Si la respuesta viene con una consulta SQL ejecutada, agregamos el visor de código
            if (sqlEjecutado) {
                const uniqueId = 'sql-' + Math.random().toString(36).substr(2, 9);
                htmlBurbuja += `
                    <div class="mt-2">
                        <button class="sql-debug-btn" onclick="
                            const panel = document.getElementById('${uniqueId}');
                            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                        ">
                            <i class="bi bi-code-slash"></i> Ver consulta SQL ejecutada
                        </button>
                        <div class="sql-debug-panel" id="${uniqueId}" style="display: none;">
                            <strong>Consulta SQL generada por IA:</strong>
                            <pre class="m-0 mt-1" style="white-space: pre-wrap;">${sqlEjecutado}</pre>
                        </div>
                    </div>
                `;
            }

            htmlBurbuja += `
                </div>
                <span class="chat-time text-muted small mt-1">${nombre}</span>
            `;

            mensajeDiv.innerHTML = htmlBurbuja;
            messagesContainer.appendChild(mensajeDiv);
        }

        // Auto scroll hacia abajo
        function desplazarAbajo() {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

});
