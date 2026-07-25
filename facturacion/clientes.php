<?php
/**
 * GET    /api/facturacion/clientes.php              → lista paginada
 *   ?page=1&per_page=25&q=texto&activo=1
 * GET    /api/facturacion/clientes.php?id=X         → un cliente
 * POST   /api/facturacion/clientes.php              → crear cliente
 * PUT    /api/facturacion/clientes.php              → actualizar cliente
 * PATCH  /api/facturacion/clientes.php              → activar/desactivar { id, activo }
 *
 * Roles permitidos: admin, contador, gerente
 * NIT y NRC se almacenan como VARCHAR (conservar ceros a la izquierda).
 */
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/../config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'contador', 'gerente'], true)) jsonError(403, 'Sin permisos');

$pdo    = getPDO();
$myId   = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    // Un cliente por ID
    if (!empty($_GET['id'])) {
        $id  = (int)$_GET['id'];
        $row = $pdo->prepare("SELECT * FROM clientes WHERE id = ?");
        $row->execute([$id]);
        $cliente = $row->fetch();
        if (!$cliente) jsonError(404, 'Cliente no encontrado');
        jsonOk($cliente);
    }

    // Lista paginada
    $page     = max(1, (int)($_GET['page']    ?? 1));
    $perPage  = min(100, max(1, (int)($_GET['per_page'] ?? 25)));
    $offset   = ($page - 1) * $perPage;
    $q        = trim($_GET['q'] ?? '');
    $soloActivos = ($_GET['activo'] ?? '1') === '1';

    $where  = $soloActivos ? 'WHERE activo = 1' : '';
    $params = [];

    if ($q !== '') {
        $like = '%' . $q . '%';
        $where = $where
            ? "$where AND (nombre LIKE ? OR nit LIKE ? OR nrc LIKE ? OR num_documento LIKE ?)"
            : "WHERE (nombre LIKE ? OR nit LIKE ? OR nrc LIKE ? OR num_documento LIKE ?)";
        $params = [$like, $like, $like, $like];
    }

    $total = $pdo->prepare("SELECT COUNT(*) FROM clientes $where");
    $total->execute($params);
    $totalRows = (int)$total->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT id, tipo_persona, tipo_doc_identificacion, num_documento,
                nit, nrc, nombre, nombre_comercial,
                es_contribuyente, codigo_actividad, descripcion_actividad,
                departamento, municipio, complemento,
                telefono, correo, activo, created_at, updated_at
         FROM clientes $where
         ORDER BY nombre ASC
         LIMIT ? OFFSET ?"
    );
    $stmt->execute([...$params, $perPage, $offset]);
    $rows = $stmt->fetchAll();

    jsonOk([
        'data'       => $rows,
        'total'      => $totalRows,
        'page'       => $page,
        'per_page'   => $perPage,
        'last_page'  => (int)ceil($totalRows / $perPage),
    ]);
}

// ── Helpers de validación ──────────────────────────────────────────────────
function validateClienteFields(array $body, bool $isCreate): array
{
    $fields = [];

    if ($isCreate || array_key_exists('tipo_persona', $body)) {
        $v = trim($body['tipo_persona'] ?? 'N');
        if (!in_array($v, ['N','J'], true)) jsonError(400, 'tipo_persona debe ser N o J');
        $fields['tipo_persona'] = $v;
    }
    if ($isCreate || array_key_exists('tipo_doc_identificacion', $body)) {
        $valid = ['13','37','36','03','02'];
        $v     = trim($body['tipo_doc_identificacion'] ?? '13');
        if (!in_array($v, $valid, true)) jsonError(400, 'tipo_doc_identificacion inválido');
        $fields['tipo_doc_identificacion'] = $v;
    }
    if (array_key_exists('num_documento', $body)) {
        $v = trim($body['num_documento'] ?? '') ?: null;
        $fields['num_documento'] = $v;
    }
    if (array_key_exists('nit', $body)) {
        $v = trim($body['nit'] ?? '') ?: null;
        if ($v !== null && !preg_match('/^\d{1,14}$/', $v)) {
            jsonError(400, 'NIT inválido: sólo dígitos, máximo 14');
        }
        $fields['nit'] = $v;
    }
    if (array_key_exists('nrc', $body)) {
        $v = trim($body['nrc'] ?? '') ?: null;
        if ($v !== null && !preg_match('/^\d{2,8}$/', $v)) {
            jsonError(400, 'NRC inválido: entre 2 y 8 dígitos');
        }
        $fields['nrc'] = $v;
    }
    if ($isCreate || array_key_exists('nombre', $body)) {
        $v = trim($body['nombre'] ?? '');
        if (!$v || mb_strlen($v) > 250) jsonError(400, 'nombre requerido, máx 250 chars');
        $fields['nombre'] = $v;
    }
    if (array_key_exists('nombre_comercial', $body)) {
        $v = trim($body['nombre_comercial'] ?? '') ?: null;
        $fields['nombre_comercial'] = $v;
    }
    if ($isCreate || array_key_exists('es_contribuyente', $body)) {
        $fields['es_contribuyente'] = empty($body['es_contribuyente']) ? 0 : 1;
    }
    if (array_key_exists('codigo_actividad', $body)) {
        $v = trim($body['codigo_actividad'] ?? '') ?: null;
        if ($v !== null && !preg_match('/^\d{5,6}$/', $v)) {
            jsonError(400, 'codigo_actividad debe tener 5 o 6 dígitos');
        }
        $fields['codigo_actividad'] = $v;
    }
    if (array_key_exists('descripcion_actividad', $body)) {
        $v = trim($body['descripcion_actividad'] ?? '') ?: null;
        $fields['descripcion_actividad'] = $v;
    }
    if (array_key_exists('departamento', $body)) {
        $v = trim($body['departamento'] ?? '') ?: null;
        $fields['departamento'] = $v;
    }
    if (array_key_exists('municipio', $body)) {
        $v = trim($body['municipio'] ?? '') ?: null;
        $fields['municipio'] = $v;
    }
    if (array_key_exists('complemento', $body)) {
        $v = trim($body['complemento'] ?? '') ?: null;
        $fields['complemento'] = $v;
    }
    if (array_key_exists('telefono', $body)) {
        $v = trim($body['telefono'] ?? '') ?: null;
        $fields['telefono'] = $v;
    }
    if (array_key_exists('correo', $body)) {
        $v = trim($body['correo'] ?? '') ?: null;
        if ($v !== null && !filter_var($v, FILTER_VALIDATE_EMAIL)) {
            jsonError(400, 'correo inválido');
        }
        $fields['correo'] = $v;
    }

    return $fields;
}

// ── POST: crear cliente ───────────────────────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    if (empty(trim($body['nombre'] ?? ''))) jsonError(400, 'nombre requerido');

    $fields = validateClienteFields($body, true);
    $fields['created_by'] = $myId;

    $cols         = array_keys($fields);
    $colList      = implode(', ', array_map(fn($c) => "`$c`", $cols));
    $placeholders = implode(', ', array_fill(0, count($cols), '?'));

    $pdo->prepare("INSERT INTO clientes ($colList) VALUES ($placeholders)")
        ->execute(array_values($fields));

    $newId = (int)$pdo->lastInsertId();
    $row   = $pdo->prepare("SELECT * FROM clientes WHERE id = ?");
    $row->execute([$newId]);
    jsonOk($row->fetch());
}

// ── PUT: actualizar cliente ───────────────────────────────────────────────
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');
    if ($id === 1) jsonError(400, 'No se puede modificar el Consumidor Final del sistema');

    $fields = validateClienteFields($body, false);
    if (empty($fields)) jsonError(400, 'Sin campos para actualizar');

    $fields['updated_by'] = $myId;
    $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($fields)));
    $vals = [...array_values($fields), $id];

    $pdo->prepare("UPDATE clientes SET $sets WHERE id = ?")->execute($vals);

    $row = $pdo->prepare("SELECT * FROM clientes WHERE id = ?");
    $row->execute([$id]);
    jsonOk($row->fetch());
}

// ── PATCH: cambiar estado activo ──────────────────────────────────────────
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');
    if ($id === 1) jsonError(400, 'No se puede desactivar el Consumidor Final del sistema');

    $activo = isset($body['activo']) ? (int)(bool)$body['activo'] : null;
    if ($activo === null) jsonError(400, 'Campo activo requerido');

    $pdo->prepare("UPDATE clientes SET activo = ?, updated_by = ? WHERE id = ?")
        ->execute([$activo, $myId, $id]);

    jsonOk(['ok' => true]);
}

jsonError(405, 'Método no permitido');
