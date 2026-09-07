# Copetran — Sistema de Información para Empresa Transportadora de Pasajeros

Proyecto académico de formulación y diseño de software para el sistema de información integral de
Copetran (transporte de pasajeros, mensajería, logística de última milla, gestión de flota, talento
humano y tecnología, a nivel nacional).

## Integrantes

- Santiago José Rodríguez Gutiérrez
- Nicolás Pérez Chuscano
- Camilo Andrés Díaz García

## Curso

Patrones de Diseño de Software (SIST0076-G02) — Universidad Sergio Arboleda
Docente: José Marcial Téllez Gómez

## Índice de entregables

### Parcial primer corte (vence 7 de septiembre de 2026)

- 📄 **[Informe PDF completo](docs/parcial-primer-corte/informe-parcial-primer-corte.pdf)** — los 9 componentes de la consigna + capturas reales de la GUI implementada (Sección 11), 24 páginas, listo para entregar
- [Brief completo](docs/parcial-primer-corte/00-brief.md)
- [1. Roles y actores del sistema](docs/parcial-primer-corte/01-roles-actores.md)
- [2. Casos de uso de alto nivel (por rol)](docs/parcial-primer-corte/02-casos-de-uso-alto-nivel.md)
- [3. Procesos principales](docs/parcial-primer-corte/03-procesos-principales.md)
- [4. Casos de uso extendidos](docs/parcial-primer-corte/04-casos-de-uso-extendidos.md)
- [5. Especificación de casos de uso](docs/parcial-primer-corte/05-especificacion-casos-de-uso.md)

**Diagramas** (`docs/parcial-primer-corte/diagramas/`):

- Diagramas de casos de uso:
  - Alto nivel — [Proceso A](docs/parcial-primer-corte/diagramas/casos-uso/casos-uso-alto-nivel-proceso-a.puml) ([PNG](docs/parcial-primer-corte/diagramas/casos-uso/casos_uso_alto_nivel_proceso_a.png)) / [Proceso C](docs/parcial-primer-corte/diagramas/casos-uso/casos-uso-alto-nivel-proceso-c.puml) ([PNG](docs/parcial-primer-corte/diagramas/casos-uso/casos_uso_alto_nivel_proceso_c.png))
  - Extendido — [CUE-01](docs/parcial-primer-corte/diagramas/casos-uso/casos-uso-extendido-cue-01.puml) ([PNG](docs/parcial-primer-corte/diagramas/casos-uso/casos_uso_extendido_cue01.png)) / [CUE-02](docs/parcial-primer-corte/diagramas/casos-uso/casos-uso-extendido-cue-02.puml) ([PNG](docs/parcial-primer-corte/diagramas/casos-uso/casos_uso_extendido_cue02.png))
- [Diagrama de clases DAO](docs/parcial-primer-corte/diagramas/clases-dao/clases-dao.puml) ([PNG](docs/parcial-primer-corte/diagramas/clases-dao/clases_dao.png))
- Diagramas de estados:
  - [Tiquete](docs/parcial-primer-corte/diagramas/estados/estado-tiquete.puml) ([PNG](docs/parcial-primer-corte/diagramas/estados/estado_tiquete.png))
  - [Guía de envío](docs/parcial-primer-corte/diagramas/estados/estado-guia-envio.puml) ([PNG](docs/parcial-primer-corte/diagramas/estados/estado_guia_envio.png))
  - [Viaje programado](docs/parcial-primer-corte/diagramas/estados/estado-viaje-programado.puml) ([PNG](docs/parcial-primer-corte/diagramas/estados/estado_viaje_programado.png))
- Diagramas de colaboración:
  - [Proceso A — Venta de tiquetes](docs/parcial-primer-corte/diagramas/colaboracion/colaboracion-venta-tiquetes.puml) ([PNG](docs/parcial-primer-corte/diagramas/colaboracion/colaboracion_venta_tiquetes.png))
  - [Proceso C — Admisión y consolidación de mensajería](docs/parcial-primer-corte/diagramas/colaboracion/colaboracion-admision-mensajeria.puml) ([PNG](docs/parcial-primer-corte/diagramas/colaboracion/colaboracion_admision_mensajeria.png))
- Diagramas de secuencia:
  - [Proceso A — Venta de tiquetes](docs/parcial-primer-corte/diagramas/secuencia/secuencia-venta-tiquetes.puml) ([PNG](docs/parcial-primer-corte/diagramas/secuencia/secuencia_venta_tiquetes.png))
  - [Proceso C — Admisión y consolidación de mensajería](docs/parcial-primer-corte/diagramas/secuencia/secuencia-admision-mensajeria.puml) ([PNG](docs/parcial-primer-corte/diagramas/secuencia/secuencia_admision_mensajeria.png))

**Fuentes de trazabilidad** (`docs/parcial-primer-corte/fuentes/`):

- [Script SQL corregido (schema real, T-SQL)](docs/parcial-primer-corte/fuentes/copetran_corregido.sql)
- [Organigrama definitivo de Copetran (transcripción)](docs/parcial-primer-corte/fuentes/organigrama-copetran.md)

### Interfaz funcional

[`frontend/`](frontend/) — React + TypeScript + Vite + TailwindCSS. Portal público de inicio
(buscador de pasajes, rastreo de envíos), acceso por rol (Cliente, Cajero de Agencia, Operario de
Bodega) y workspace con KPIs en tiempo real, ECU-01 (mapa de asientos + pase de abordaje con QR) y
ECU-02 (cubicaje + liquidación de flete), sobre datos mock en memoria. Ver
[`frontend/README.md`](frontend/README.md) para cómo correrlo, o las capturas en la Sección 11 del
informe PDF de arriba.

### CR-1 T-2 — Formulación de Proyecto

Documento fuente de verdad del caso Copetran (organigrama, procesos, requerimientos, modelo relacional
en SQL Server, auditoría del modelo). El parcial primer corte se construye sobre este documento,
manteniendo trazabilidad total con él.
