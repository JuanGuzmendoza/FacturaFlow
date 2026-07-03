# Proyecto CRUD: Control de Facturas Pagadas a Empresas

Este es un proyecto educativo desarrollado con **Node.js**, **Express**, **MySQL** y el motor de plantillas **EJS**, implementando la arquitectura **MVC (Modelo-Vista-Controlador)**. Está diseñado especialmente para aprender y enseñar a grupos de trabajo de manera clara y sencilla.

El proyecto permite gestionar un control completo de **Facturas** que han sido pagadas a diferentes empresas prestadoras de servicios.

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:
1. **Node.js** (Versión 16 o superior recomendada).
2. Un servidor local de bases de datos MySQL, como por ejemplo:
   - **XAMPP** (Activar módulo MySQL).
   - **Laragon**.
   - **WampServer**.
   - MySQL Server instalado directamente.

---

## ⚙️ Configuración Inicial (Paso a Paso)

### 1. Preparar la Base de Datos
1. Inicia tu servidor local de MySQL (ej. abre el panel de **XAMPP** y dale clic a **Start** en MySQL).
2. Abre tu gestor de base de datos preferido (phpMyAdmin, DBeaver, HeidiSQL, etc.).
3. Ve a la herramienta de ejecución de consultas SQL e importa o copia y pega el contenido del archivo:
   👉 `documentos/script_db.sql`
4. Esto creará la base de datos `sistema_facturas`, la tabla `facturas` e ingresará 5 registros de prueba listos para usar.

### 2. Configurar Variables de Entorno
En la raíz del proyecto encontrarás un archivo llamado `.env`. Este archivo contiene las credenciales de tu base de datos local:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=sistema_facturas
```
*Nota: Si tienes una contraseña en tu MySQL (por ejemplo, en Laragon o si la definiste manualmente), escríbela en `DB_PASS=tu_contraseña`.*

### 3. Instalar Dependencias
Abre una terminal (PowerShell, CMD, o la terminal integrada de VS Code) en la carpeta raíz del proyecto y ejecuta el siguiente comando:
```bash
npm install
```
Esto descargará automáticamente todas las carpetas y librerías necesarias (`express`, `ejs`, `mysql2`, `dotenv`, `nodemon`).

### 4. Iniciar el Proyecto
Para iniciar el servidor en modo de desarrollo con recarga automática, ejecuta en tu terminal:
```bash
npm run dev
```
Verás mensajes en tu consola confirmando que el servidor inició y que la conexión a MySQL fue exitosa:
```text
Servidor iniciado y ejecutándose localmente en: http://localhost:3000
Conexión establecida con éxito con la base de datos MySQL.
```

Abre tu navegador e ingresa a: **`http://localhost:3000`**

---

## 📁 Arquitectura del Proyecto (MVC)

El proyecto está organizado bajo la estructura estándar de desarrollo:

*   **`config/bd.js`**: Crea y exporta el pool de conexiones hacia MySQL.
*   **`routes/`**: Define las direcciones web (URLs) que el usuario puede visitar:
    *   `inicioRoutes.js`: Ruta de la página de bienvenida.
    *   `facturasRoutes.js`: Rutas del CRUD para las facturas(Listado, Crear, Editar, Eliminar).
    *   `empresasRoutes.js`: Rutas del CRUD para las empresas(Listado, Crear, Editar, Eliminar).
*   **`controllers/`**: Contiene el "cerebro" y lógica de negocio. Recibe las peticiones, hace consultas SQL a la base de datos y renderiza las vistas.
    *   `inicioController.js`: Lógica para mostrar la página de inicio.
    *   `facturasController.js`: Lógica MySQL para el CRUD completo de las empresas.
    *   `empresasController.js`: Lógica MySQL para el CRUD completo de las empresas.
*   **`views/`**: Archivos HTML con la sintaxis de EJS (`.ejs`) que se pintan en el navegador.
    *   `partials/header.ejs` y `partials/footer.ejs`: Cabecera y pie de página reutilizables con estilos cargados.
    *   `inicio.ejs`: Página de bienvenida elegante.
    *   `facturas/index.ejs`: Muestra las facturas en una tabla pulida con tarjetas de métricas.
    *   `facturas/formulario.ejs`: Formulario reutilizado para agregar nuevas facturas y editar existentes de forma clara.
    *   `empresas/index.ejs`: Muestra las empresas en una tabla pulida con tarjetas de métricas.
    *   `empresas/formulario.ejs`: Formulario reutilizado para agregar nuevas empresas y editar existentes de forma clara.
*   **`public/`**: Archivos estáticos accesibles por el navegador:
    *   `css/estilos.css`: Hoja de estilos moderna y premium.
    *   `js/scripts.js`: Código del frontend para alertas interactivas y confirmación de borrado.

---

## 💡 Flujo de Trabajo para Explicar en Clase

1.  **El Servidor (`server.js`)**: Explica que es el punto de inicio de la aplicación y monta las rutas.
2.  **Las Rutas (`routes/`)**: Explica que asocian una URL con una función específica de un controlador (ej. `GET /facturas` -> `facturasController.obtenerTodas`).
3.  **El Controlador (`controllers/`)**: Explica cómo el controlador ejecuta la consulta SQL tradicional (como `SELECT * FROM facturas`) y envía ese resultado a la vista usando `res.render()`.
4.  **La Vista (`views/`)**: Muestra cómo con EJS (`<% %>`) recorremos el arreglo de registros de la base de datos usando un bucle `forEach` para pintar las filas de la tabla de forma dinámica.
5.  **El Cliente (`public/js/scripts.js`)**: Explica cómo añadimos interactividad en el navegador del usuario para prevenir eliminaciones accidentales deteniendo el evento del formulario.
