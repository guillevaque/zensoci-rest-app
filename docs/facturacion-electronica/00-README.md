# Facturación Electrónica DTE — Documentación Técnica

## Propósito

Este directorio contiene la documentación técnica preparatoria para la integración del sistema de
Documentos Tributarios Electrónicos (DTE) del Ministerio de Hacienda de El Salvador sobre el POS
existente de Zensoci.

## Documentos

| Archivo | Contenido |
|---|---|
| `01-Arquitectura-Actual.md` | Stack tecnológico, entornos, flujo de despliegue |
| `02-Mapa-del-Sistema.md` | Rutas, endpoints PHP y clientes HTTP del frontend |
| `03-Analisis-Base-Datos.md` | Tablas existentes, columnas, relaciones e índices |
| `04-Modulos-Existentes.md` | Descripción funcional de cada módulo del POS |
| `05-Brechas-DTE.md` | Qué falta para cumplir DTE y qué puede reutilizarse |
| `06-Plan-General.md` | Fases de implementación propuestas |
| `07-Preguntas-Pendientes.md` | Información que debe confirmar el equipo antes de implementar |

## Referencias externas

- Manual Técnico para la Integración Tecnológica del Sistema de Transmisión v2.1 (MH El Salvador)
- Manual Funcional del Sistema de Transmisión v2.0 (MH El Salvador)
- Catálogos Facturación Electrónica v1.1 (MH El Salvador)
- Firmador oficial: imagen Docker `svfe/svfe-api-firmador:v20260316`

## Rama de trabajo

Toda la integración DTE se desarrolla sobre la rama `feat/dte-foundation`. Nunca se trabaja
directamente en `main` ni en `developer`.

## Estado

> **Fase actual: Análisis y documentación preparatoria.**
> No se ha modificado ningún archivo funcional del sistema.
