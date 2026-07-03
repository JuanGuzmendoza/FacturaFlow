-- =======================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS Y TABLAS (RELACIONAL)
-- Proyecto: CRUD de Facturas Pagadas a Empresas con Chatbot IA
-- Estructura: MySQL (Relación Uno a Muchos)
-- =======================================================

-- 1. Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS sistema_facturas 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. Seleccionar la base de datos para su uso
USE sistema_facturas;

-- Desactivar llaves foráneas temporalmente para limpieza segura
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS facturas;
DROP TABLE IF EXISTS empresas;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Crear la tabla 'empresas' (con campo email solicitado)
CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NULL
) ENGINE=InnoDB;

-- 4. Crear la tabla 'facturas' con relación de llave foránea
CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    empresa_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATE NOT NULL,
    descripcion TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Insertar registros iniciales de empresas con sus correos
INSERT INTO empresas (id, nombre, email) VALUES
(1, 'Microsoft Colombia S.A.S.', 'billing@microsoft.com'),
(2, 'Amazon Web Services (AWS)', 'invoices@aws.com'),
(3, 'Google LLC', 'payments@google.com'),
(4, 'Oracle de Colombia', 'soporte@oracle.com'),
(5, 'Adobe Systems Inc', 'licencias@adobe.com'),
(6, 'Claro', 'servicio@claro.com.co');

-- 6. Insertar registros iniciales de facturas
INSERT INTO facturas (numero_factura, empresa_id, monto, fecha_pago, descripcion) VALUES
('FAC-1001', 1, 1540.50, '2026-05-10', 'Pago de suscripción mensual de Azure Cloud y cuentas Office 365.'),
('FAC-1002', 2, 2890.00, '2026-05-14', 'Costo de alojamiento de servidores de producción de la compañía.'),
('FAC-1003', 3, 420.75, '2026-05-15', 'Servicios de Google Workspace e integraciones de mapas en el backend.'),
('FAC-1004', 4, 5600.00, '2026-05-18', 'Licenciamiento de bases de datos empresariales y soporte técnico.'),
('FAC-1005', 5, 315.00, '2026-05-19', 'Licencias del equipo de diseño gráfico y desarrollo web.');
