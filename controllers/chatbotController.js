const bd = require('../config/bd');
const { Groq } = require('groq-sdk');

// Inicializar el cliente Groq con la clave del archivo .env
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// --- 1. MOSTRAR PÁGINA DEL CHATBOT ---
exports.mostrarChat = (req, res) => {
    res.render('chatbot');
};

// --- 2. PROCESAR PREGUNTA (TEXT-TO-SQL) ---
exports.procesarPregunta = async (req, res) => {
    const { pregunta, historial } = req.body;

    if (!pregunta || pregunta.trim() === '') {
        return res.json({ success: false, respuesta: 'Por favor, escribe una pregunta válida.' });
    }

    try {
        // 1. Prompt del sistema para indicarle a Groq que traduzca el lenguaje natural a SQL
        const systemPromptSQL = `
Eres un traductor de lenguaje natural a SQL para una base de datos MySQL de facturas pagadas a empresas.
La base de datos tiene las siguientes tablas y columnas:

Tabla "empresas":
- id (INT, PRIMARY KEY)
- nombre (VARCHAR, contiene el nombre de la empresa, ej: 'Microsoft Colombia S.A.S.', 'Claro', 'Google LLC')

Tabla "facturas":
- id (INT, PRIMARY KEY)
- numero_factura (VARCHAR, identificador único, ej: 'FAC-1001')
- empresa_id (INT, FOREIGN KEY que conecta con empresas.id)
- monto (DECIMAL, dinero pagado en la factura)
- fecha_pago (DATE, formato YYYY-MM-DD)
- descripcion (TEXT, concepto o notas adicionales del pago)

REGLAS CRÍTICAS DE GENERACIÓN:
1. Genera ÚNICAMENTE una consulta SQL de tipo SELECT.
2. Si la consulta involucra nombres de empresas o listados conjuntos, utiliza un JOIN:
   SELECT f.*, e.nombre AS nombre_empresa FROM facturas f JOIN empresas e ON f.empresa_id = e.id
3. Usa filtros insensibles a mayúsculas y minúsculas (ej. LIKE con '%Nombre%') para buscar nombres de empresas si no son exactos.
4. Está ESTRICTAMENTE PROHIBIDO generar consultas de inserción, actualización, eliminación o alteración de la base de datos (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE).
5. Devuelve únicamente la consulta SQL limpia en texto plano, sin bloques de código markdown (\`\`\`sql) ni explicaciones de ningún tipo.
        `;

        // Construir mensajes para el SQL Generator con el historial para mantener contexto
        const messagesSQL = [{ role: 'system', content: systemPromptSQL }];
        if (historial && Array.isArray(historial)) {
            historial.forEach(msg => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messagesSQL.push({ role: msg.role, content: msg.content });
                }
            });
        }
        messagesSQL.push({ role: 'user', content: pregunta });

        // 2. Llamada a Groq para generar la consulta SQL
        const completadoSQL = await groq.chat.completions.create({
            messages: messagesSQL,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.0, // Cero temperatura para precisión absoluta
            max_tokens: 300
        });

        let consultaSQL = completadoSQL.choices[0]?.message?.content || '';
        
        // Limpiar cualquier markdown o formato que la IA haya agregado por error
        consultaSQL = consultaSQL.replace(/```sql/gi, '').replace(/```/g, '').trim();

        // 3. VALIDACIÓN DE SEGURIDAD (Solo permitir SELECT)
        const sqlMayusculas = consultaSQL.toUpperCase();
        
        if (!sqlMayusculas.startsWith('SELECT')) {
            return res.json({
                success: false,
                respuesta: 'Por motivos de seguridad, solo tengo permitido realizar consultas de lectura en la base de datos (SELECT). No puedo ejecutar comandos destructivos o de escritura.',
                sql_ejecutado: consultaSQL || 'No se generó consulta SELECT'
            });
        }

        // Bloqueo adicional de palabras clave destructivas
        if (sqlMayusculas.includes('INSERT') || sqlMayusculas.includes('UPDATE') || 
            sqlMayusculas.includes('DELETE') || sqlMayusculas.includes('DROP') || 
            sqlMayusculas.includes('ALTER') || sqlMayusculas.includes('TRUNCATE')) {
            return res.json({
                success: false,
                respuesta: 'Consulta denegada por seguridad. Se detectaron palabras clave de alteración o borrado de datos.',
                sql_ejecutado: consultaSQL
            });
        }

        // 4. EJECUTAR CONSULTA SQL EN MYSQL
        bd.query(consultaSQL, async (error, resultados) => {
            if (error) {
                console.error('Error al ejecutar SQL generado por la IA:', error.message);
                return res.json({
                    success: false,
                    respuesta: 'Tuve problemas al estructurar la consulta SQL correcta para esa pregunta. ¿Podrías intentar formularla de otra manera?',
                    sql_ejecutado: consultaSQL
                });
            }

            // 5. ENVIAR RESULTADOS A GROQ PARA REDACTAR RESPUESTA NATURAL
            try {
                const systemPromptRespuesta = `Eres un asistente de facturas inteligente y amigable en español.
Tus respuestas anteriores deben mantener coherencia con las nuevas preguntas del usuario.
Pautas:
- Si el JSON está vacío (no hay registros), díselo amablemente al usuario (ej: "No encontré facturas registradas para Claro").
- Si hay cifras de dinero (monto), formátalas de manera amigable (ej: $8.500.000).
- Si hay fechas, muéstralas de forma legible (ej. 1 de Junio de 2026).
- Mantén la respuesta concisa y profesional. No menciones detalles técnicos de la base de datos o la consulta SQL a menos que el usuario te pregunte cómo la obtuviste.`;

                // Construir mensajes para la respuesta natural
                const messagesRespuesta = [{ role: 'system', content: systemPromptRespuesta }];
                if (historial && Array.isArray(historial)) {
                    historial.forEach(msg => {
                        if (msg.role === 'user' || msg.role === 'assistant') {
                            messagesRespuesta.push({ role: msg.role, content: msg.content });
                        }
                    });
                }
                messagesRespuesta.push({
                    role: 'user',
                    content: `Pregunta actual: "${pregunta}"
Para responder esta pregunta, se ejecutó esta consulta SQL SELECT: "${consultaSQL}"
La base de datos MySQL devolvió los siguientes resultados en formato JSON:
${JSON.stringify(resultados)}

Por favor, redacta una respuesta conversacional clara, concisa y amigable en español basada estrictamente en esos resultados.`
                });

                const completadoRespuesta = await groq.chat.completions.create({
                    messages: messagesRespuesta,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.5,
                    max_tokens: 800
                });

                const respuestaNatural = completadoRespuesta.choices[0]?.message?.content || 'No se obtuvo respuesta redactada.';

                // Responder al frontend con éxito, la respuesta natural y el SQL que se utilizó para transparencia
                res.json({
                    success: true,
                    respuesta: respuestaNatural,
                    sql_ejecutado: consultaSQL
                });

            } catch (errGroq) {
                console.error('Error al redactar respuesta con Groq:', errGroq.message);
                res.json({
                    success: true,
                    respuesta: `Tengo los resultados de la base de datos, pero no pude redactar un texto natural. Aquí tienes los datos obtenidos:\n\n${JSON.stringify(resultados)}`,
                    sql_ejecutado: consultaSQL
                });
            }
        });

    } catch (errorGeneral) {
        console.error('Error en el controlador del Chatbot:', errorGeneral.message);
        res.json({
            success: false,
            respuesta: 'Lo siento, ocurrió un error al comunicarme con el servicio de IA de Groq. Verifica la API Key en el archivo .env.'
        });
    }
};
