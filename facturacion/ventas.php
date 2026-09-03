<?php
/**
 * GET    /api/facturacion/ventas.php                   → lista paginada
 *   ?page=1&per_page=25&estado=BORRADOR&canal=...&q=texto&fecha_desde=Y-m-d&fecha_hasta=Y-m-d
 * GET    /api/facturacion/ventas.php?id=X              → venta + items + pagos
 * POST   /api/facturacion/ventas.php                   → crear venta (estado BORRADOR)
 * PUT    /api/facturacion/ventas.php                   → actualizar venta BORRADOR
 * POST   /api/facturacion/ventas.php  (accion=cerrar)  → completar venta (transacción)
 * POST   /api/facturacion/ventas.php  (accion=anular)  → anular venta COMPLETADA/BORRADOR
 *
 * Roles permitidos: admin, manager, contador, gerente, caja
 * NO genera JSON DTE, NO firma, NO transmite al MH.
 * Los montos se guardan en DECIMAL. El IVA se calcula en el cliente y se reconfirma aquí.
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

// ── GET ───────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    // Venta individual con items y pagos
    if (!empty($_GET['id'])) {
        $id = (int)$_GET['id'];

        $stmt = $pdo->prepare(
            "SELECT v.*,
                    c.nombre AS cliente_nombre, c.nit AS cliente_nit, c.nrc AS cliente_nrc,
                    c.tipo_persona, c.es_contribuyente
             FROM ventas v
             LEFT JOIN clientes c ON c.id = v.cliente_id
             WHERE v.id = ?"
        );
        $stmt->execute([$id]);
        $venta = $stmt->fetch();
        if (!$venta) jsonError(404, 'Venta no encontrada');

        $iStmt = $pdo->prepare(
            "SELECT * FROM venta_items WHERE venta_id = ? ORDER BY numero_item ASC"
        );
        $iStmt->execute([$id]);
        $venta['items'] = $iStmt->fetchAll();

        $pStmt = $pdo->prepare(
            "SELECT * FROM pagos WHERE venta_id = ? ORDER BY id ASC"
        );
        $pStmt->execute([$id]);
        $venta['pagos'] = $pStmt->fetchAll();

        jsonOk($venta);
    }

    // Lista paginada
    $page    = max(1, (int)($_GET['page']     ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 25)));
    $offset  = ($page - 1) * $perPage;

    $where  = ['1=1'];
    $params = [];

    if (!empty($_GET['estado'])) {
        $where[] = 'v.estado = ?';
        $params[] = $_GET['estado'];
    }
    if (!empty($_GET['canal'])) {
        $where[] = 'v.canal = ?';
        $params[] = $_GET['canal'];
    }
    if (!empty($_GET['fecha_desde'])) {
        $where[] = 'v.fecha_venta >= ?';
        $params[] = $_GET['fecha_desde'];
    }
    if (!empty($_GET['fecha_hasta'])) {
        $where[] = 'v.fecha_venta <= ?';
        $params[] = $_GET['fecha_hasta'];
    }
    if (!empty($_GET['q'])) {
        $like = '%' . $_GET['q'] . '%';
        $where[] = '(c.nombre LIKE ? OR v.referencia_externa LIKE ? OR v.numero LIKE ?)';
        $params = array_merge($params, [$like, $like, $like]);
    }

    $whereStr = implode(' AND ', $where);

    $totalStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE $whereStr"
    );
    $totalStmt->execute($params);
    $total = (int)$totalStmt->fetchColumn();

    $listStmt = $pdo->prepare(
        "SELECT v.id, v.numero, v.canal, v.referencia_externa,
                v.fecha_venta, v.estado, v.total_pagar, v.monto_total_operacion,
                v.created_at, v.completed_at,
                c.nombre AS cliente_nombre, c.nit AS cliente_nit
         FROM ventas v
         LEFT JOIN clientes c ON c.id = v.cliente_id
         WHERE $whereStr
         ORDER BY v.id DESC
         LIMIT ? OFFSET ?"
    );
    $listStmt->execute([...$params, $perPage, $offset]);

    jsonOk([
        'data'      => $listStmt->fetchAll(),
        'total'     => $total,
        'page'      => $page,
        'per_page'  => $perPage,
        'last_page' => (int)ceil($total / $perPage),
    ]);
}

// ── Lectura del body (POST / PUT) ──────────────────────────────────────────
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$accion = trim($body['accion'] ?? '');

// ── POST: cerrar venta (transacción) ─────────────────────────────────────
if ($method === 'POST' && $accion === 'cerrar') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT * FROM ventas WHERE id = ? FOR UPDATE");
        $stmt->execute([$id]);
        $venta = $stmt->fetch();

        if (!$venta) { $pdo->rollBack(); jsonError(404, 'Venta no encontrada'); }
        if ($venta['estado'] !== 'BORRADOR') {
            $pdo->rollBack();
            jsonError(409, 'Solo se pueden completar ventas en estado BORRADOR');
        }

        // Verificar que tenga al menos un ítem
        $iCount = $pdo->prepare("SELECT COUNT(*) FROM venta_items WHERE venta_id = ?");
        $iCount->execute([$id]);
        if ((int)$iCount->fetchColumn() === 0) {
            $pdo->rollBack();
            jsonError(400, 'La venta debe tener al menos un ítem antes de completarse');
        }

        $pdo->prepare(
            "UPDATE ventas SET estado = 'COMPLETADA', completed_at = NOW(), updated_by = ? WHERE id = ?"
        )->execute([$myId, $id]);

        $pdo->commit();

        $row = $pdo->prepare("SELECT * FROM ventas WHERE id = ?");
        $row->execute([$id]);
        jsonOk($row->fetch());

    } catch (\Throwable $e) {
        $pdo->rollBack();
        jsonError(500, 'Error al completar la venta: ' . $e->getMessage());
    }
}

// ── POST: anular venta ────────────────────────────────────────────────────
if ($method === 'POST' && $accion === 'anular') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    $stmt = $pdo->prepare("SELECT estado FROM ventas WHERE id = ?");
    $stmt->execute([$id]);
    $venta = $stmt->fetch();

    if (!$venta) jsonError(404, 'Venta no encontrada');
    if ($venta['estado'] === 'ANULADA') jsonError(409, 'La venta ya está anulada');

    $pdo->prepare(
        "UPDATE ventas SET estado = 'ANULADA', updated_by = ? WHERE id = ?"
    )->execute([$myId, $id]);

    jsonOk(['ok' => true, 'id' => $id, 'estado' => 'ANULADA']);
}

// ── POST: crear venta BORRADOR ────────────────────────────────────────────
if ($method === 'POST') {

    // Idempotencia: si ya existe un registro con esta clave, devolver el existente
    $iKey = trim($body['idempotency_key'] ?? '');
    if ($iKey !== '') {
        $dup = $pdo->prepare("SELECT * FROM ventas WHERE idempotency_key = ?");
        $dup->execute([$iKey]);
        $existing = $dup->fetch();
        if ($existing) jsonOk($existing);
    }

    // Duplicate prevention para canales externos
    $canal = strtoupper(trim($body['canal'] ?? 'MANUAL'));
    if (!in_array($canal, ['MANUAL','PEDIDOS_YA','WEB','APP','OTRO'], true)) {
        jsonError(400, 'canal inválido');
    }
    $refExt = trim($body['referencia_externa'] ?? '') ?: null;
    if ($refExt !== null) {
        $dupExt = $pdo->prepare(
            "SELECT id FROM ventas WHERE canal = ? AND referencia_externa = ?"
        );
        $dupExt->execute([$canal, $refExt]);
        if ($dupExt->fetch()) jsonError(409, 'Ya existe una venta con esa referencia_externa para este canal');
    }

    $clienteId  = (int)($body['cliente_id'] ?? 1);
    $fechaVenta = trim($body['fecha_venta'] ?? date('Y-m-d'));
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaVenta)) {
        jsonError(400, 'fecha_venta inválida (Y-m-d)');
    }

    // Verificar cliente
    $cStmt = $pdo->prepare("SELECT id FROM clientes WHERE id = ? AND activo = 1");
    $cStmt->execute([$clienteId]);
    if (!$cStmt->fetch()) jsonError(404, 'Cliente no encontrado o inactivo');

    // Obtener siguiente número de venta (lock de fila)
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE ventas_secuencia SET ultimo_numero = ultimo_numero + 1 WHERE id = 1")
            ->execute();
        $numStmt = $pdo->query("SELECT ultimo_numero FROM ventas_secuencia WHERE id = 1");
        $numero  = (int)$numStmt->fetchColumn();

        $fields = [
            'numero'              => $numero,
            'cliente_id'          => $clienteId,
            'canal'               => $canal,
            'referencia_externa'  => $refExt,
            'fecha_venta'         => $fechaVenta,
            'total_no_sujeto'     => roundAmount($body['total_no_sujeto']     ?? 0),
            'total_exento'        => roundAmount($body['total_exento']         ?? 0),
            'total_gravado'       => roundAmount($body['total_gravado']        ?? 0),
            'subtotal_ventas'     => roundAmount($body['subtotal_ventas']      ?? 0),
            'total_descuento'     => roundAmount($body['total_descuento']      ?? 0),
            'iva_total'           => roundAmount($body['iva_total']            ?? 0),
            'costo_envio'         => roundAmount($body['costo_envio']          ?? 0),
            'propina'             => roundAmount($body['propina']              ?? 0),
            'monto_total_operacion' => roundAmount($body['monto_total_operacion'] ?? 0),
            'total_pagar'         => roundAmount($body['total_pagar']          ?? 0),
            'estado'              => 'BORRADOR',
            'observaciones'       => trim($body['observaciones'] ?? '') ?: null,
            'created_by'          => $myId,
        ];
        if ($iKey !== '') $fields['idempotency_key'] = $iKey;

        $cols = array_keys($fields);
        $colList = implode(', ', array_map(fn($c) => "`$c`", $cols));
        $placeholders = implode(', ', array_fill(0, count($cols), '?'));

        $pdo->prepare("INSERT INTO ventas ($colList) VALUES ($placeholders)")
            ->execute(array_values($fields));

        $newId = (int)$pdo->lastInsertId();

        // Insertar ítems si vienen en el body
        if (!empty($body['items']) && is_array($body['items'])) {
            insertItems($pdo, $newId, $body['items']);
        }

        $pdo->commit();

        $row = $pdo->prepare("SELECT * FROM ventas WHERE id = ?");
        $row->execute([$newId]);
        jsonOk($row->fetch());

    } catch (\Throwable $e) {
        $pdo->rollBack();
        jsonError(500, 'Error al crear la venta: ' . $e->getMessage());
    }
}

// ── PUT: actualizar venta BORRADOR ────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'id requerido');

    $stmt = $pdo->prepare("SELECT estado FROM ventas WHERE id = ?");
    $stmt->execute([$id]);
    $venta = $stmt->fetch();
    if (!$venta) jsonError(404, 'Venta no encontrada');
    if ($venta['estado'] !== 'BORRADOR') {
        jsonError(409, 'Solo se puede editar una venta en estado BORRADOR');
    }

    $fields = ['updated_by' => $myId];

    $montoKeys = [
        'total_no_sujeto','total_exento','total_gravado','subtotal_ventas',
        'total_descuento','iva_total','costo_envio','propina',
        'monto_total_operacion','total_pagar',
    ];
    foreach ($montoKeys as $k) {
        if (array_key_exists($k, $body)) $fields[$k] = roundAmount($body[$k]);
    }

    if (array_key_exists('cliente_id', $body)) {
        $cid = (int)$body['cliente_id'];
        $cStmt = $pdo->prepare("SELECT id FROM clientes WHERE id = ? AND activo = 1");
        $cStmt->execute([$cid]);
        if (!$cStmt->fetch()) jsonError(404, 'Cliente no encontrado');
        $fields['cliente_id'] = $cid;
    }
    if (array_key_exists('fecha_venta', $body)) {
        $fv = trim($body['fecha_venta']);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fv)) jsonError(400, 'fecha_venta inválida');
        $fields['fecha_venta'] = $fv;
    }
    if (array_key_exists('observaciones', $body)) {
        $fields['observaciones'] = trim($body['observaciones']) ?: null;
    }

    $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($fields)));
    $vals = [...array_values($fields), $id];

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE ventas SET $sets WHERE id = ?")->execute($vals);

        // Reemplazar ítems si vienen
        if (isset($body['items']) && is_array($body['items'])) {
            $pdo->prepare("DELETE FROM venta_items WHERE venta_id = ?")->execute([$id]);
            if (!empty($body['items'])) {
                insertItems($pdo, $id, $body['items']);
            }
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        jsonError(500, 'Error al actualizar la venta: ' . $e->getMessage());
    }

    $row = $pdo->prepare("SELECT * FROM ventas WHERE id = ?");
    $row->execute([$id]);
    jsonOk($row->fetch());
}

jsonError(405, 'Método no permitido');

// ── Helpers ───────────────────────────────────────────────────────────────
function roundAmount($v): float
{
    return round((float)$v, 2);
}

function insertItems(\PDO $pdo, int $ventaId, array $items): void
{
    $stmt = $pdo->prepare(
        "INSERT INTO venta_items
         (venta_id, numero_item, descripcion, codigo_producto, cantidad,
          precio_unitario, descuento, tipo_item, no_gravado, exento,
          total_gravado, total_exento, total_no_sujeto)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    );

    foreach ($items as $idx => $item) {
        $numItem  = (int)($item['numero_item'] ?? ($idx + 1));
        $desc     = trim($item['descripcion'] ?? '');
        if (!$desc) continue;

        $stmt->execute([
            $ventaId,
            $numItem,
            $desc,
            trim($item['codigo_producto'] ?? '') ?: null,
            (float)($item['cantidad']        ?? 1),
            (float)($item['precio_unitario'] ?? 0),
            (float)($item['descuento']       ?? 0),
            (int)($item['tipo_item']         ?? 1),
            (int)(bool)($item['no_gravado']  ?? false),
            (int)(bool)($item['exento']      ?? false),
            roundAmount($item['total_gravado']    ?? 0),
            roundAmount($item['total_exento']     ?? 0),
            roundAmount($item['total_no_sujeto']  ?? 0),
        ]);
    }
}
