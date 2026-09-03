<?php
/**
 * GET    /api/facturacion/pagos.php?venta_id=X   → pagos de una venta
 * POST   /api/facturacion/pagos.php              → registrar pago
 * DELETE /api/facturacion/pagos.php?id=X         → eliminar pago (solo si venta BORRADOR)
 *
 * Roles permitidos: admin, manager, contador, gerente, caja
 * Solo se pueden agregar / eliminar pagos de ventas en estado COMPLETADA o BORRADOR.
 * Los pagos de ventas ANULADAS son inmutables.
 */
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/../config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'manager', 'contador', 'gerente', 'caja'], true)) {
    jsonError(403, 'Sin permisos');
}

$pdo    = getPDO();
$myId   = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

$formasPago = ['01','02','03','04','99'];

// ── GET ───────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $ventaId = (int)($_GET['venta_id'] ?? 0);
    if (!$ventaId) jsonError(400, 'venta_id requerido');

    $stmt = $pdo->prepare(
        "SELECT p.*, u.nombre AS cajero
         FROM pagos p
         LEFT JOIN users u ON u.id = p.created_by
         WHERE p.venta_id = ?
         ORDER BY p.id ASC"
    );
    $stmt->execute([$ventaId]);
    jsonOk($stmt->fetchAll());
}

// ── POST: registrar pago ──────────────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $ventaId = (int)($body['venta_id'] ?? 0);
    if (!$ventaId) jsonError(400, 'venta_id requerido');

    $vStmt = $pdo->prepare("SELECT estado FROM ventas WHERE id = ?");
    $vStmt->execute([$ventaId]);
    $venta = $vStmt->fetch();
    if (!$venta) jsonError(404, 'Venta no encontrada');
    if ($venta['estado'] === 'ANULADA') jsonError(409, 'No se pueden agregar pagos a una venta anulada');

    $formaPago = trim($body['forma_pago'] ?? '01');
    if (!in_array($formaPago, $formasPago, true)) {
        jsonError(400, 'forma_pago inválida: ' . implode(', ', $formasPago));
    }

    $monto = round((float)($body['monto'] ?? 0), 2);
    if ($monto <= 0) jsonError(400, 'monto debe ser mayor que 0');

    $referencia = trim($body['referencia'] ?? '') ?: null;

    $ins = $pdo->prepare(
        "INSERT INTO pagos (venta_id, forma_pago, referencia, monto, created_by)
         VALUES (?, ?, ?, ?, ?)"
    );
    $ins->execute([$ventaId, $formaPago, $referencia, $monto, $myId]);

    $newId = (int)$pdo->lastInsertId();
    $row   = $pdo->prepare("SELECT * FROM pagos WHERE id = ?");
    $row->execute([$newId]);
    jsonOk($row->fetch());
}

// ── DELETE: eliminar pago ─────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    // Verificar que la venta no esté COMPLETADA ni ANULADA (solo borrador permite eliminar pagos)
    $stmt = $pdo->prepare(
        "SELECT v.estado FROM pagos p JOIN ventas v ON v.id = p.venta_id WHERE p.id = ?"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonError(404, 'Pago no encontrado');
    if (in_array($row['estado'], ['COMPLETADA','ANULADA'], true)) {
        jsonError(409, 'No se puede eliminar un pago de una venta ' . $row['estado']);
    }

    $pdo->prepare("DELETE FROM pagos WHERE id = ?")->execute([$id]);
    jsonOk(['ok' => true]);
}

jsonError(405, 'Método no permitido');
