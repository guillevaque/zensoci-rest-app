<?php
/**
 * /api/upload.php – Subida de imágenes para el menú
 * POST multipart/form-data con campo "image"
 * Devuelve: { "ok": true, "path": "/assets/menu/filename.ext" }
 */
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError(405, 'Método no permitido');

if (empty($_FILES['image'])) jsonError(400, 'No se recibió ninguna imagen');

$file  = $_FILES['image'];
$error = $file['error'] ?? UPLOAD_ERR_NO_FILE;

if ($error !== UPLOAD_ERR_OK) {
    $msgs = [
        UPLOAD_ERR_INI_SIZE   => 'Archivo demasiado grande (límite del servidor)',
        UPLOAD_ERR_FORM_SIZE  => 'Archivo demasiado grande (límite del formulario)',
        UPLOAD_ERR_PARTIAL    => 'El archivo se subió de forma incompleta',
        UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'Sin directorio temporal en el servidor',
        UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir el archivo en disco',
    ];
    jsonError(400, $msgs[$error] ?? 'Error de subida (código ' . $error . ')');
}

// Detectar MIME — cadena de fallback para máxima compatibilidad
$mime = '';
if (function_exists('finfo_open')) {
    $fi   = finfo_open(FILEINFO_MIME_TYPE);
    $mime = (string)finfo_file($fi, $file['tmp_name']);
    finfo_close($fi);
}
if (!$mime && function_exists('mime_content_type')) {
    $mime = (string)mime_content_type($file['tmp_name']);
}
if (!$mime) {
    $mime = (string)($file['type'] ?? '');
}

$extMap = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

if (!isset($extMap[$mime])) {
    jsonError(400, 'Solo se permiten JPG, PNG, WebP o GIF. MIME detectado: "' . $mime . '"');
}
$ext = $extMap[$mime];

// Nombre seguro
$original = pathinfo($file['name'], PATHINFO_FILENAME);
$slug     = preg_replace('/[^a-z0-9]+/', '-', strtolower($original));
$slug     = trim($slug, '-') ?: 'imagen';
$filename = $slug . '-' . uniqid() . '.' . $ext;

// Directorio de destino — intentar DOCUMENT_ROOT primero, fallback a __DIR__
$candidates = [
    rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . '/assets/menu/',
    __DIR__ . '/assets/menu/',
];

$uploadDir = null;
foreach ($candidates as $candidate) {
    if (!$candidate || $candidate === '/assets/menu/') continue;
    if (!is_dir($candidate)) {
        @mkdir($candidate, 0755, true);
    }
    if (is_writable($candidate)) {
        $uploadDir = $candidate;
        break;
    }
}

if (!$uploadDir) {
    jsonError(500, 'No se pudo encontrar un directorio de uploads escribible. Candidates: ' . implode(', ', $candidates));
}

$dest = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    jsonError(500, 'No se pudo mover el archivo a: ' . $dest);
}

// Devolvemos la ruta relativa — el frontend construye la URL absoluta con el origen correcto
jsonOk(['ok' => true, 'path' => '/assets/menu/' . $filename]);
