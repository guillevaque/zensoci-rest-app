<?php
// api/costeo.php
// Endpoint para costeo de platillos Zensoci POS
// Coloca este archivo en tu carpeta /api/ en Hostinger

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// -- Conexión (usa las mismas credenciales que el resto del backend) --
require_once __DIR__ . '/config.php'; // $pdo ya disponible

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    // ── GET /costeo.php?id=N  →  platillo + ingredientes ──────────────
    if ($method === 'GET' && $id) {
        $stmt = $pdo->prepare('SELECT * FROM costeo_platillos WHERE id = ?');
        $stmt->execute([$id]);
        $platillo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$platillo) { http_response_code(404); echo json_encode(['error' => 'No encontrado']); exit; }

        // Detalle de ingredientes con el costo VIVO del catálogo unificado.
        // COALESCE: usa el costo del ingrediente; si es línea de empaque, el del empaque.
        $stmt2 = $pdo->prepare(
            'SELECT d.*,
                    COALESCE(i.unit_cost, e.unit_cost) AS precio_unitario_actual
               FROM costeo_detalle_ingredientes d
               LEFT JOIN ingredients i ON i.id = d.ingredient_id
               LEFT JOIN empaques    e ON e.id = d.empaque_id
              WHERE d.costeo_platillo_id = ?
              ORDER BY d.tipo, d.id'
        );
        $stmt2->execute([$id]);
        $platillo['ingredientes'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($platillo);
        exit;
    }

    // ── GET /costeo.php  →  lista de platillos ────────────────────────
    if ($method === 'GET') {
        $where = ['activo = 1'];
        $params = [];

        if (!empty($_GET['categoria'])) {
            $where[] = 'categoria = ?';
            $params[] = $_GET['categoria'];
        }
        if (!empty($_GET['q'])) {
            $where[] = 'nombre LIKE ?';
            $params[] = '%' . $_GET['q'] . '%';
        }

        $sql = 'SELECT * FROM costeo_platillos WHERE ' . implode(' AND ', $where) . ' ORDER BY numero_menu';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    // ── PUT /costeo.php?id=N  →  actualizar precio/margen ────────────
    if ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $allowed = ['precio_con_iva', 'precio_sin_iva', 'costo_unitario', 'incremento_delivery',
                    'precio_delivery', 'precio_delivery_sin_iva', 'activo', 'ultima_actualizacion'];
        $sets = [];
        $vals = [];
        foreach ($allowed as $col) {
            if (array_key_exists($col, $data)) { $sets[] = "$col = ?"; $vals[] = $data[$col]; }
        }
        if (empty($sets)) { http_response_code(400); echo json_encode(['error' => 'Sin campos válidos']); exit; }
        $vals[] = $id;
        $pdo->prepare('UPDATE costeo_platillos SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
