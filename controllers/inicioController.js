const bd = require('../config/bd');


exports.mostrarPrueba = (req, res) => {
    res.send('¡Ruta de prueba funcionando correctamente 123!');
};

// Controlador para la página principal de bienvenida
exports.mostrarInicio = (req, res) => {
    // Consulta para obtener estadísticas rápidas para la vista de inicio
    const consultaStats = `
        SELECT 
            COUNT(*) AS total_facturas, 
            COALESCE(SUM(monto), 0) AS total_monto 
        FROM facturas
    `;
    
    bd.query(consultaStats, (error, resultados) => {
        if (error) {
            // Si hay un error (ej. la base de datos no está creada todavía),
            // renderizamos la página con valores en cero para evitar que se caiga
            console.warn('Nota: No se pudieron cargar estadísticas en la página de inicio (puede ser que la base de datos no esté creada).');
            return res.render('inicio', { 
                totalFacturas: 0, 
                totalMonto: '0.00' 
            });
        }
        
        const estadisticas = resultados[0];
        res.render('inicio', { 
            totalFacturasEstadistica: estadisticas.total_facturas, 
            // Formatear el monto a dos decimales
            totalMonto: parseFloat(estadisticas.total_monto).toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        });
    });
};
