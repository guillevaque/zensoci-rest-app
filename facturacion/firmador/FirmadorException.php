<?php
/**
 * FirmadorException
 *
 * Lanzada por FirmadorClient ante:
 *  - error de red o timeout (cURL)
 *  - código HTTP no exitoso
 *  - respuesta no parseable como JSON
 *  - campo status=ERROR en la respuesta (error funcional con HTTP 200)
 */
class FirmadorException extends \RuntimeException
{
    /** Respuesta decodificada del Firmador, cuando estuvo disponible. */
    private array $firmadorResponse;

    public function __construct(string $message, int $httpCode = 0, array $firmadorResponse = [])
    {
        parent::__construct($message, $httpCode);
        $this->firmadorResponse = $firmadorResponse;
    }

    /** Devuelve la respuesta JSON del Firmador (puede estar vacía si hubo error de red). */
    public function getFirmadorResponse(): array
    {
        return $this->firmadorResponse;
    }
}
