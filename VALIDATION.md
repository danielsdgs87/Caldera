# Boiler Studio — validación del proyecto

- Modelo 3D procedural de una caldera pirotubular horizontal; no utiliza archivos GLB ni activos 3D de terceros.
- 8 sistemas interactivos y 111 piezas de catálogo.
- Distribución: 20 piezas de cuerpo/aislamiento, 4 de hogar, 45 tubos de humo, 9 del quemador, 7 de cámaras de humos, 7 del circuito agua/vapor, 9 de válvulas/instrumentación y 10 de bancada.
- Se conserva la lógica del proyecto de referencia: órbita, zoom, rotación automática, aislamiento por sistema/pieza, etiquetas, selección por clic y despiece progresivo hasta una vista totalmente explotada.
- La geometría representa principios generales de una caldera industrial y no corresponde a un fabricante específico.
- El código TypeScript/TSX fue revisado sintácticamente con el compilador de TypeScript disponible en el entorno.
- La instalación completa de dependencias puede realizarse con `npm ci` en un entorno con acceso normal al registro npm; no se incluyen `node_modules` en el ZIP.
