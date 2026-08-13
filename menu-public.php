<?php
/**
 * GET /api/menu-public.php
 * Endpoint de solo lectura — sin autenticación requerida.
 * Devuelve únicamente platos con active = 1.
 * Consumido por la landing pública zensoci.com.
 *
 * POST / PUT / DELETE → 405 Method Not Allowed.
 */

// ── Orígenes permitidos para este endpoint público ─────────────────────────
$origin        = $_SERVER['HTTP_ORIGIN'] ?? '';
$publicOrigins = [
    'https://zensoci.com',
    'http://localhost:5173',
    'http://localhost:3000',
];
$originAllowed = in_array($origin, $publicOrigins, true);

// ── Preflight OPTIONS — interceptar ANTES de headers.php ──────────────────
// headers.php del backend administrativo maneja OPTIONS con exit,
// por eso respondemos aquí para poder enviar nuestros propios orígenes.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($originAllowed) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
        header("Access-Control-Allow-Methods: GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type");
    }
    http_response_code(204);
    exit;
}

// ── Cargar helpers del backend (jsonError, jsonOk, getPDO) ─────────────────
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

// ── Sobreescribir el CORS que headers.php estableció para orígenes públicos ─
// header() con replace=true (por defecto) sustituye el valor anterior.
if ($originAllowed) {
    header("Access-Control-Allow-Origin: $origin", true);
    header("Vary: Origin", false);
}
// Endpoint público: sin credenciales
header_remove('Access-Control-Allow-Credentials');

// ── Solo GET ───────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError(405, 'Método no permitido');
}

// ── Consulta ───────────────────────────────────────────────────────────────
try {
    $pdo  = getPDO();
    $stmt = $pdo->query(
        'SELECT id,
                name        AS nombre,
                category    AS categoria,
                price       AS precio,
                description AS descripcion,
                image_url,
                active      AS activo
         FROM menu
         WHERE active = 1
         ORDER BY category ASC, name ASC'
    );
    jsonOk($stmt->fetchAll());
} catch (Throwable $e) {
    error_log('[menu-public.php] ' . $e->getMessage());
    jsonError(500, 'Error interno del servidor');
}
