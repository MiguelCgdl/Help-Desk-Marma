# Diagrama de Flujo: Sistema de Tickets Marmacore

```mermaid
graph TD
    %% Public Side
    Start((Inicio)) --> Landing[Formulario de Ticket Público]
    Landing --> SelectComp[Seleccionar Empresa]
    SelectComp --> SelectProb[Seleccionar Problema]
    SelectProb --> InputDesc[Descripción max 800 chars]
    InputDesc --> UploadImg{¿Subir Imagen?}
    UploadImg -- Sí --> Attached[Adjuntar JPEG/JPG]
    UploadImg -- No --> Submit[Enviar Ticket]
    Attached --> Submit
    Submit --> GenID[Backend: Generar ID Único]
    GenID --> ShowID[Mostrar Número de Ticket]
    ShowID --> Done((Fin))

    %% Admin Side
    AdminStart((Acceso Admin)) --> Login[Autenticación JWT]
    Login --> Dashboard[Panel de Control]
    Dashboard --> CompMgmt[Gestión de Empresas]
    Dashboard --> ProbMgmt[Gestión de Problemas]
    Dashboard --> TicketFeed[Listado de Tickets]
    Dashboard --> MonthlyRep[Reportes y Concentrados]

    CompMgmt --> SetCost[Configurar Costo por Ticket]
    MonthlyRep --> Filter[Filtrar por Mes/Año]
    Filter --> AggData[Concentrado por Empresa]
    AggData --> CalcTotal[Cálculo de Facturación Total]
```

## Características Principales
1. **Lógica de Numeración**: `PREFIJO-AAAAMMDD-SEQ` (ej: MARMA-20240407-0001).
2. **Branding**: Paleta de colores Marmacore (Naranja #FD5200, Teal #00272E, Jakarta Sans).
3. **Tecnología**: MongoDB, Express, React, TypeScript.
4. **Resumen Financiero**: Concentrado mensual automático basado en el costo configurado por empresa.
