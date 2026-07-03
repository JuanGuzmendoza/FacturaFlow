const bd = require('../config/bd');
const { Groq } = require('groq-sdk');

// Inicializar el cliente Groq con la clave del archivo .env
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// --- 1. OBTENER TODAS LAS FACTURAS (LEER) ---
exports.obtenerTodas = (req, res) => {
    // Consulta con JOIN para traer el nombre de la empresa relacionada
    const consulta = `
        SELECT f.*, e.nombre AS nombre_empresa 
        FROM facturas f 
        JOIN empresas e ON f.empresa_id = e.id 
        ORDER BY f.fecha_pago DESC, f.id DESC
    `;
    
    bd.query(consulta, (error, resultados) => {
        if (error) {
            console.error('Error al obtener las facturas:', error.message);
            return res.status(500).send('Error interno del servidor al consultar la base de datos.');
        }
        
        // Calcular estadísticas específicas de la página de listado
        const totalFacturas = resultados.length;
        const sumaMonto = resultados.reduce((total, factura) => total + parseFloat(factura.monto), 0);
        
        // Renderizamos la vista de listado enviando los resultados y métricas
        res.render('facturas/index', { 
            facturas: resultados,
            totalFacturas: totalFacturas,
            sumaMonto: sumaMonto.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        });
    });
};

// --- 2. MOSTRAR FORMULARIO DE CREACIÓN (CREAR) ---
exports.mostrarFormularioCrear = (req, res) => {
    const facturaVacia = {
        id: '',
        numero_factura: '',
        empresa_id: '',
        monto: '',
        fecha_pago: '',
        descripcion: ''
    };
    
    // Obtener la lista de empresas registradas para el select dropdown
    bd.query('SELECT * FROM empresas ORDER BY nombre', (error, empresas) => {
        if (error) {
            console.error('Error al obtener las empresas:', error.message);
            return res.status(500).send('Error al cargar la lista de empresas.');
        }
        
        res.render('facturas/formulario', { 
            factura: facturaVacia, 
            empresas: empresas,
            modo: 'crear',
            tituloPagina: 'Registrar Nueva Factura'
        });
    });
};

// --- 3. GUARDAR NUEVA FACTURA (CREAR) ---
exports.crearFactura = (req, res) => {
    const { numero_factura, empresa_id, monto, fecha_pago, descripcion } = req.body;
    
    const consulta = 'INSERT INTO facturas (numero_factura, empresa_id, monto, fecha_pago, descripcion) VALUES (?, ?, ?, ?, ?)';
    const valores = [numero_factura, empresa_id, monto, fecha_pago, descripcion || null];
    
    bd.query(consulta, valores, (error, resultado) => {
        if (error) {
            console.error('Error al insertar factura:', error.message);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).send('Error: El número de factura ya se encuentra registrado.');
            }
            
            return res.status(500).send('Error al guardar la factura en la base de datos.');
        }
        
        res.redirect('/facturas');
    });
};

// --- 4. MOSTRAR FORMULARIO DE EDICIÓN (EDITAR) ---
exports.mostrarFormularioEditar = (req, res) => {
    const { id } = req.params;
    
    // 1. Obtener los datos de la factura que se va a editar
    bd.query('SELECT * FROM facturas WHERE id = ?', [id], (error, resultados) => {
        if (error) {
            console.error('Error al buscar factura para editar:', error.message);
            return res.status(500).send('Error al buscar el registro.');
        }
        
        if (resultados.length === 0) {
            return res.status(404).send('Factura no encontrada.');
        }
        
        const factura = resultados[0];
        
        // Formatear la fecha a YYYY-MM-DD para el input tipo date
        if (factura.fecha_pago) {
            const fechaObj = new Date(factura.fecha_pago);
            const anio = fechaObj.getFullYear();
            const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const dia = String(fechaObj.getDate()).padStart(2, '0');
            factura.fecha_pago_formateada = `${anio}-${mes}-${dia}`;
        } else {
            factura.fecha_pago_formateada = '';
        }
        
        // 2. Obtener la lista de empresas para llenar el select dropdown
        bd.query('SELECT * FROM empresas ORDER BY nombre', (errorEmp, empresas) => {
            if (errorEmp) {
                console.error('Error al obtener empresas:', errorEmp.message);
                return res.status(500).send('Error al cargar la lista de empresas.');
            }
            
            res.render('facturas/formulario', { 
                factura: factura, 
                empresas: empresas,
                modo: 'editar',
                tituloPagina: 'Editar Factura'
            });
        });
    });
};

// --- 5. ACTUALIZAR FACTURA (EDITAR) ---
exports.actualizarFactura = (req, res) => {
    const { id } = req.params;
    const { numero_factura, empresa_id, monto, fecha_pago, descripcion } = req.body;
    
    const consulta = `
        UPDATE facturas 
        SET numero_factura = ?, empresa_id = ?, monto = ?, fecha_pago = ?, descripcion = ? 
        WHERE id = ?
    `;
    const valores = [numero_factura, empresa_id, monto, fecha_pago, descripcion || null, id];
    
    bd.query(consulta, valores, (error, resultado) => {
        if (error) {
            console.error('Error al actualizar factura:', error.message);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).send('Error: El número de factura ya está registrado en otra factura.');
            }
            
            return res.status(500).send('Error al actualizar el registro en la base de datos.');
        }
        
        res.redirect('/facturas');
    });
};

// --- 6. ELIMINAR FACTURA (ELIMINAR) ---
exports.eliminarFactura = (req, res) => {
    const { id } = req.params;
    const consulta = 'DELETE FROM facturas WHERE id = ?';
    
    bd.query(consulta, [id], (error, resultado) => {
        if (error) {
            console.error('Error al eliminar factura:', error.message);
            return res.status(500).send('Error al eliminar la factura.');
        }
        
        res.redirect('/facturas');
    });
};

// --- 7. MEJORAR DESCRIPCIÓN CON IA (AJAX / POST) ---
exports.generarDescripcionIA = (req, res) => {
    const { empresa_id, monto, fecha_pago, descripcion } = req.body;

    if (!empresa_id || !monto || !fecha_pago) {
        return res.json({ success: false, mensaje: 'Por favor completa Empresa, Monto y Fecha para usar la IA.' });
    }

    if (!descripcion || descripcion.trim() === '') {
        return res.json({ success: false, mensaje: 'Por favor, escribe un borrador en la descripción antes de usar la IA para mejorarla.' });
    }

    // Buscar el nombre de la empresa para contextualizar a la IA
    bd.query('SELECT nombre FROM empresas WHERE id = ?', [empresa_id], async (error, resultados) => {
        if (error || resultados.length === 0) {
            return res.json({ success: false, mensaje: 'Empresa no encontrada.' });
        }

        const nombreEmpresa = resultados[0].nombre;

        try {
            // Prompt para que Groq corrija y mejore el borrador del usuario
            const promptContext = `
Eres un redactor y editor profesional de descripciones para facturas en español.
El usuario ha redactado el siguiente borrador de descripción para una factura:
"${descripcion}"

Información adicional de la factura para dar contexto:
- Empresa: "${nombreEmpresa}"
- Monto: "${monto}"
- Fecha de Pago: "${fecha_pago}"

Tu tarea es mejorar y corregir el borrador del usuario para hacerlo sonar más profesional, formal, claro y adecuado para contabilidad en español.
Pautas de edición:
1. Mantén la esencia y el significado original del borrador del usuario.
2. Corrige cualquier error ortográfico o gramatical.
3. Hazlo más profesional e institucional, mejorando el vocabulario.
4. Si el borrador es extremadamente simple o corto, enriquécelo de forma formal.
5. La respuesta debe tener una longitud de máximo 25 palabras.
6. Devuelve ÚNICAMENTE la descripción corregida y mejorada. No agregues introducciones, explicaciones, saludos ni comillas.
            `;

            const completado = await groq.chat.completions.create({
                messages: [
                    { role: 'user', content: promptContext }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                max_tokens: 150
            });

            let descripcionIA = completado.choices[0]?.message?.content || '';
            descripcionIA = descripcionIA.replace(/"/g, '').replace(/'/g, '').trim();

            res.json({ success: true, descripcion: descripcionIA });

        } catch (errGroq) {
            console.error('Error al mejorar descripción con Groq:', errGroq.message);
            res.json({ success: false, mensaje: 'Error al contactar al servicio de Inteligencia Artificial.' });
        }
    });
};
