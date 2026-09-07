# Boiler Studio

Aplicación web 3D interactiva para estudiar una **caldera industrial pirotubular horizontal** mediante rotación, zoom, aislamiento de sistemas, etiquetas y despiece progresivo.

## Qué incluye

- Modelo 3D procedural: no depende de archivos GLB externos.
- 8 sistemas: cuerpo/aislamiento, hogar, haz tubular, quemador, cámaras de humos, agua/vapor, válvulas/instrumentación y bancada.
- Más de 100 piezas seleccionables individualmente.
- Despiece progresivo de 0 a 100%.
- Aislamiento por sistema o pieza.
- Etiquetas 3D y selección directa haciendo clic en la geometría.
- Diseño responsive para escritorio y móvil.

## Ejecutar localmente

Requiere Node.js 22.13+ y npm.

```sh
npm ci
npm run dev -- --port 3015
```

Luego abre `http://localhost:3015`.

## Compilar

```sh
npm run build:vercel
```

## Alcance

El modelo es didáctico y representa principios generales de una caldera pirotubular. No corresponde a un fabricante específico y no debe utilizarse como plano de fabricación, mantenimiento, cálculo de presión o certificación.
