<?php
/**
 * /api/costeo.php — Consultas de costeo de platillos (solo lectura + actualización de precios)
 * Tablas: costeo_platillos, ingredientes (filas con costeo_platillo_id)
 */
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    $pdo = getPDO();

    // ── GET /costeo.php?id=N  →  platillo + ingredientes de receta ──────
    if ($method === 'GET' && $id) {
        $stmt = $pdo->prepare('SELECT * FROM costeo_platillos WHERE id = ?');
        $stmt->execute([$id]);
        $platillo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$platillo) jsonError(404, 'Platillo no encontrado');

        // Líneas de receta + costo vivo del catálogo:
        //   - ingredientes con costeo_platillo_id = $id son las líneas de receta
        //   - self-join con costeo_platillo_id IS NULL obtiene el precio actual del catálogo
        //   - empaques se resuelven desde la tabla empaques separada
        $stmt2 = $pdo->prepare('
            SELECT r.*,
                   COALESCE(cat.costo_unitario, emp.costo_unitario) AS precio_unitario_actual
              FROM ingredientes r
              LEFT JOIN ingredientes cat ON cat.nombre = r.nombre
                                        AND cat.costeo_platillo_id IS NULL
              LEFT JOIN empaques     emp ON emp.nombre = r.nombre
                                        AND r.tipo_receta = \'empaque\'
             WHERE r.costeo_platillo_id = ?
             ORDER BY r.tipo_receta, r.id
        ');
        $stmt2->execute([$id]);
        $platillo['ingredientes'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        jsonOk($platillo);
    }

    // ── GET /costeo.php  →  lista de platillos activos ──────────────────
    if ($method === 'GET') {
        $where  = ['activo = 1'];
        $params = [];

        if (!empty($_GET['categoria'])) {
            $where[]  = 'categoria = ?';
            $params[] = $_GET['categoria'];
        }
        if (!empty($_GET['q'])) {
            $where[]  = 'nombre LIKE ?';
            $params[] = '%' . $_GET['q'] . '%';
        }

        $sql  = 'SELECT * FROM costeo_platillos WHERE ' . implode(' AND ', $where) . ' ORDER BY numero_menu';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonOk($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ── PUT /costeo.php?id=N  →  actualizar precio o margen ─────────────
    if ($method === 'PUT' && $id) {
        $b       = json_decode(file_get_contents('php://input'), true) ?? [];
        $allowed = [
            'precio_con_iva', 'precio_sin_iva', 'costo_unitario',
            'incremento_delivery', 'precio_delivery', 'precio_delivery_sin_iva',
            'activo', 'ultima_actualizacion',
        ];
        $sets = [];
        $vals = [];
        foreach ($allowed as $col) {
            if (array_key_exists($col, $b)) {
                $sets[] = "$col = ?";
                $vals[] = $b[$col];
            }
        }
        if (empty($sets)) jsonError(400, 'Sin campos válidos para actualizar');

        $vals[] = $id;
        $pdo->prepare('UPDATE costeo_platillos SET ' . implode(', ', $sets) . ' WHERE id = ?')
            ->execute($vals);
        jsonOk(['ok' => true]);
    }

    jsonError(405, 'Método no permitido');

} catch (Throwable $e) {
    error_log('[costeo.php] ' . $e->getMessage());
    jsonError(500, 'Error interno del servidor');
}
