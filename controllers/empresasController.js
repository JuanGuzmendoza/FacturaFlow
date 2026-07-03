const bd = require('../config/bd');

exports.obtenerTodas = (req, res) => {
    const consulta = 'SELECT * FROM empresas ORDER BY id DESC';
    
     bd.query(consulta, (error, resultados) => {
        if (error) {
            console.error('Error al obtener las empresas:', error.message);
            return res.status(500).send('Error interno del servidor al consultar base de datos.');
        }
        
        const totalEmpresas = resultados.length;
      
        res.render('empresas/index', { 
            empresas: resultados,
            totalEmpresas: totalEmpresas
        });
    });
};

exports.mostrarFormularioCrear = (req, res) => {

    const empresaVacia = {
        id: '',
        nombre: '',
        email: ''
    };

    res.render('empresas/formulario', { 
        empresa: empresaVacia, 
        modo: 'crear',
        tituloPagina: 'Registrar Nueva Empresa'
    });
};


exports.crearEmpresa = (req, res) => {
    const { nombre, email_empresa } = req.body;

    const consulta = 'INSERT INTO empresas (nombre, email) VALUES (?, ?)';
    const valores = [nombre, email_empresa];

    bd.query(consulta, valores, (error, resultado) => {
        if (error) {
            console.error('Error al insertar empresa:', error.message);
            return res.status(500).send('Error al guardar la empresa en la base de datos.');
        }

        res.redirect('/empresas');
    });
};