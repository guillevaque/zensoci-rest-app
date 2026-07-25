<?php
/**
 * GET  /api/facturacion/fiscal-config.php        → configuración activa
 * POST /api/facturacion/fiscal-config.php        → crear configuración inicial
 * PUT  /api/facturacion/fiscal-config.php        → actualizar configuración existente
 *
 * Roles permitidos: admin, contador
 * NIT y NRC se almacenan como texto (VARCHAR) para conservar ceros a la izquierda.
 * NO se almacenan certificados, contraseñas privadas, JWT ni credenciales MH.
 */
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/../config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'contador'], true)) jsonError(403, 'Sin permisos');

$pdo    = getPDO();
$myId   = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: configuración activa ─────────────────────────────────────────────
if ($method === 'GET') {
    $row = $pdo->query(
        "SELECT id, nit, nrc, nombre_legal, nombre_comercial,
                codigo_actividad, descripcion_actividad,
                departamento, municipio, distrito, complemento,
                telefono, correo,
                codigo_establecimiento, codigo_punto_venta,
                ambiente, modelo_facturacion, activo,
                created_at, updated_at
         FROM configuracion_fiscal
         WHERE activo = 1
         ORDER BY id DESC LIMIT 1"
    )->fetch();

    jsonOk($row ?: null);
}

// ── Lectura del body para POST y PUT ─────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true) ?? [];

function extractFiscalFields(array $body): array
{
    $fields = [];

    if (array_key_exists('nit', $body)) {
        $nit = trim($body['nit']);
        if (!preg_match('/^\d{1,14}$/', $nit)) {
            jsonError(400, 'NIT inválido: sólo dígitos, máximo 14');
        }
        $fields['nit'] = $nit;
    }
    if (array_key_exists('nrc', $body)) {
        $nrc = trim($body['nrc']);
        if (!preg_match('/^\d{2,8}$/', $nrc)) {
            jsonError(400, 'NRC inválido: entre 2 y 8 dígitos');
        }
        $fields['nrc'] = $nrc;
    }
    if (array_key_exists('nombre_legal', $body)) {
        $v = trim($body['nombre_legal']);
        if (!$v || mb_strlen($v) > 250) jsonError(400, 'nombre_legal requerido, máx 250');
        $fields['nombre_legal'] = $v;
    }
    if (array_key_exists('nombre_comercial', $body)) {
        $v = trim($body['nombre_comercial'] ?? '') ?: null;
        $fields['nombre_comercial'] = $v;
    }
    if (array_key_exists('codigo_actividad', $body)) {
        $v = trim($body['codigo_actividad']);
        if (!preg_match('/^\d{5,6}$/', $v)) jsonError(400, 'codigo_actividad debe tener 5 o 6 dígitos');
        $fields['codigo_actividad'] = $v;
    }
    if (array_key_exists('descripcion_actividad', $body)) {
        $v = trim($body['descripcion_actividad']);
        if (!$v || mb_strlen($v) > 150) jsonError(400, 'descripcion_actividad requerida, máx 150');
        $fields['descripcion_actividad'] = $v;
    }
    if (array_key_exists('departamento', $body)) {
        $v = trim($body['departamento']);
        if (!preg_match('/^\d{2}$/', $v)) jsonError(400, 'departamento debe ser código de 2 dígitos');
        $fields['departamento'] = $v;
    }
    if (array_key_exists('municipio', $body)) {
        $v = trim($body['municipio']);
        if (!preg_match('/^\d{4}$/', $v)) jsonError(400, 'municipio debe ser código de 4 dígitos');
        $fields['municipio'] = $v;
    }
    if (array_key_exists('distrito', $body)) {
        $v = trim($body['distrito'] ?? '') ?: null;
        $fields['distrito'] = $v;
    }
    if (array_key_exists('complemento', $body)) {
        $v = trim($body['complemento']);
        if (!$v || mb_strlen($v) > 200) jsonError(400, 'complemento requerido, máx 200');
        $fields['complemento'] = $v;
    }
    if (array_key_exists('telefono', $body)) {
        $v = trim($body['telefono']);
        if (mb_strlen($v) < 8 || mb_strlen($v) > 30) jsonError(400, 'telefono: 8–30 caracteres');
        $fields['telefono'] = $v;
    }
    if (array_key_exists('correo', $body)) {
        $v = trim($body['correo']);
        if (!filter_var($v, FILTER_VALIDATE_EMAIL) || mb_strlen($v) > 100) {
            jsonError(400, 'correo inválido, máx 100 chars');
        }
        $fields['correo'] = $v;
    }
    if (array_key_exists('codigo_establecimiento', $body)) {
        $v = trim($body['codigo_establecimiento'] ?? '') ?: null;
        if ($v !== null && !preg_match('/^\d{4}$/', $v)) {
            jsonError(400, 'codigo_establecimiento debe tener exactamente 4 dígitos o dejarse vacío');
        }
        $fields['codigo_establecimiento'] = $v;
    }
    if (array_key_exists('codigo_punto_venta', $body)) {
        $v = trim($body['codigo_punto_venta'] ?? '') ?: null;
        if ($v !== null && mb_strlen($v) > 15) jsonError(400, 'codigo_punto_venta máx 15 chars');
        $fields['codigo_punto_venta'] = $v;
    }
    if (array_key_exists('ambiente', $body)) {
        $v = trim($body['ambiente']);
        if (!in_array($v, ['00', '01'], true)) jsonError(400, 'ambiente debe ser 00 o 01');
        $fields['ambiente'] = $v;
    }
    if (array_key_exists('modelo_facturacion', $body)) {
        $v = (int)$body['modelo_facturacion'];
        if (!in_array($v, [1, 2], true)) jsonError(400, 'modelo_facturacion debe ser 1 o 2');
        $fields['modelo_facturacion'] = $v;
    }

    return $fields;
}

// ── POST: crear configuración ─────────────────────────────────────────────
if ($method === 'POST') {
    $required = ['nit','nrc','nombre_legal','codigo_actividad','descripcion_actividad',
                 'departamento','municipio','complemento','telefono','correo'];
    foreach ($required as $k) {
        if (!isset($body[$k]) || trim((string)$body[$k]) === '') {
            jsonError(400, "Campo requerido: $k");
        }
    }

    $fields = extractFiscalFields($body);

    $cols = array_keys($fields);
    $cols[] = 'created_by';
    $placeholders = implode(', ', array_fill(0, count($cols), '?'));
    $colList = implode(', ', array_map(fn($c) => "`$c`", $cols));

    $vals = array_values($fields);
    $vals[] = $myId;

    $pdo->prepare("INSERT INTO configuracion_fiscal ($colList) VALUES ($placeholders)")
        ->execute($vals);

    $newId = (int)$pdo->lastInsertId();
    $row   = $pdo->prepare("SELECT * FROM configuracion_fiscal WHERE id = ?");
    $row->execute([$newId]);
    jsonOk($row->fetch());
}

// ── PUT: actualizar configuración ─────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    $fields = extractFiscalFields($body);
    if (empty($fields)) jsonError(400, 'Sin campos para actualizar');

    $fields['updated_by'] = $myId;

    $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($fields)));
    $vals = array_values($fields);
    $vals[] = $id;

    $pdo->prepare("UPDATE configuracion_fiscal SET $sets WHERE id = ?")
        ->execute($vals);

    $row = $pdo->prepare("SELECT * FROM configuracion_fiscal WHERE id = ?");
    $row->execute([$id]);
    jsonOk($row->fetch());
}

jsonError(405, 'Método no permitido');
