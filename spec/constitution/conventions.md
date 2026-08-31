# Convenciones

- Navegación orientada a proyecto/version/run.
- Estados loading/empty/error/partial explícitos.
- No ocultar PARTIAL o FAILED detrás de mensajes genéricos.
- No reimplementar reglas de generación/validación del backend.
- Polling V1 respeta `pollAfterMs`, se cancela al desmontar/cambiar operación y termina en estados terminales.
- Diff legible para MODIFIED; CREATED se muestra como archivo nuevo.
- Accesibilidad básica: teclado, labels, focus, contraste y tablas con encabezados.
- Formato consistente de fechas, duraciones, porcentajes, tokens y costos.
