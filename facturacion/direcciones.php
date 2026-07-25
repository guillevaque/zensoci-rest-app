<?php
/**
 * GET    /api/facturacion/direcciones.php?cliente_id=X  → direcciones del cliente
 * POST   /api/facturacion/direcciones.php               → agregar dirección
 * PUT    /api/facturacion/direcciones.php               → actualizar dirección
 * PATCH  /api/facturacion/direcciones.php               → marcar como principal { id, es_principal: true }
 * DELETE /api/facturacion/direcciones.php?id=X          → desactivar dirección
 *
 * Roles permitidos: admin, contador, gerente
 */
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/../config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'manager', 'contador', 'gerente'], true)) jsonError(403, 'Sin permisos');

$pdo    = getPDO();
$myId   = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: direcciones del cliente ──────────────────────────────────────────
if ($method === 'GET') {
    $clienteId = (int)($_GET['cliente_id'] ?? 0);
    if (!$clienteId) jsonError(400, 'cliente_id requerido');

    $stmt = $pdo->prepare(
        "SELECT id, cliente_id, etiqueta,
                departamento, municipio, distrito, complemento,
                es_principal, activo, created_at, updated_at
         FROM cliente_direcciones
         WHERE cliente_id = ? AND activo = 1
         ORDER BY es_principal DESC, id ASC"
    );
    $stmt->execute([$clienteId]);
    jsonOk($stmt->fetchAll());
}

// ── POST: agregar dirección ───────────────────────────────────────────────
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $clienteId = (int)($body['cliente_id'] ?? 0);
    if (!$clienteId) jsonError(400, 'cliente_id requerido');

    // verificar que el cliente exista
    $check = $pdo->prepare("SELECT id FROM clientes WHERE id = ? AND activo = 1");
    $check->execute([$clienteId]);
    if (!$check->fetch()) jsonError(404, 'Cliente no encontrado');

    $depto       = trim($body['departamento'] ?? '');
    $muni        = trim($body['municipio']    ?? '');
    $complemento = trim($body['complemento']  ?? '');

    if (!preg_match('/^\d{2}$/', $depto))   jsonError(400, 'departamento debe ser código 2 dígitos');
    if (!preg_match('/^\d{4}$/', $muni))    jsonError(400, 'municipio debe ser código 4 dígitos');
    if (!$complemento || mb_strlen($complemento) > 200) jsonError(400, 'complemento requerido, máx 200');

    $etiqueta   = trim($body['etiqueta'] ?? 'Principal') ?: 'Principal';
    $distrito   = trim($body['distrito'] ?? '') ?: null;
    $esPrincipal = empty($body['es_principal']) ? 0 : 1;

    if ($esPrincipal) {
        $pdo->prepare("UPDATE cliente_direcciones SET es_principal = 0 WHERE cliente_id = ?")
            ->execute([$clienteId]);
    }

    $pdo->prepare(
        "INSERT INTO cliente_direcciones
         (cliente_id, etiqueta, departamento, municipio, distrito, complemento, es_principal, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )->execute([$clienteId, $etiqueta, $depto, $muni, $distrito, $complemento, $esPrincipal, $myId]);

    $newId = (int)$pdo->lastInsertId();
    $row   = $pdo->prepare("SELECT * FROM cliente_direcciones WHERE id = ?");
    $row->execute([$newId]);
    jsonOk($row->fetch());
}

// ── PUT: actualizar dirección ─────────────────────────────────────────────
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    $fields = [];

    if (array_key_exists('etiqueta', $body)) {
        $v = trim($body['etiqueta']) ?: 'Principal';
        $fields['etiqueta'] = $v;
    }
    if (array_key_exists('departamento', $body)) {
        $v = trim($body['departamento']);
        if (!preg_match('/^\d{2}$/', $v)) jsonError(400, 'departamento inválido');
        $fields['departamento'] = $v;
    }
    if (array_key_exists('municipio', $body)) {
        $v = trim($body['municipio']);
        if (!preg_match('/^\d{4}$/', $v)) jsonError(400, 'municipio inválido');
        $fields['municipio'] = $v;
    }
    if (array_key_exists('distrito', $body)) {
        $fields['distrito'] = trim($body['distrito'] ?? '') ?: null;
    }
    if (array_key_exists('complemento', $body)) {
        $v = trim($body['complemento']);
        if (!$v || mb_strlen($v) > 200) jsonError(400, 'complemento requerido, máx 200');
        $fields['complemento'] = $v;
    }

    if (empty($fields)) jsonError(400, 'Sin campos para actualizar');

    $fields['updated_by'] = $myId;
    $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($fields)));
    $vals = [...array_values($fields), $id];

    $pdo->prepare("UPDATE cliente_direcciones SET $sets WHERE id = ?")->execute($vals);

    $row = $pdo->prepare("SELECT * FROM cliente_direcciones WHERE id = ?");
    $row->execute([$id]);
    jsonOk($row->fetch());
}

// ── PATCH: marcar como principal ─────────────────────────────────────────
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    // obtener cliente_id de esta dirección
    $dir = $pdo->prepare("SELECT cliente_id FROM cliente_direcciones WHERE id = ?");
    $dir->execute([$id]);
    $existing = $dir->fetch();
    if (!$existing) jsonError(404, 'Dirección no encontrada');

    $clienteId = (int)$existing['cliente_id'];

    // quitar principal de todas las del cliente
    $pdo->prepare("UPDATE cliente_direcciones SET es_principal = 0 WHERE cliente_id = ?")
        ->execute([$clienteId]);

    // marcar esta como principal
    $pdo->prepare("UPDATE cliente_direcciones SET es_principal = 1, updated_by = ? WHERE id = ?")
        ->execute([$myId, $id]);

    jsonOk(['ok' => true]);
}

// ── DELETE: desactivar dirección ──────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    $pdo->prepare("UPDATE cliente_direcciones SET activo = 0, updated_by = ? WHERE id = ?")
        ->execute([$myId, $id]);

    jsonOk(['ok' => true]);
}

jsonError(405, 'Método no permitido');
