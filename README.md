## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

### Opciones:

- Ingresar el nombre de una ciudad.
- Guardar la ciudad por defecto.
- Registrar varias otras ciudades para buscar el clima en esas otras ciudades.
- Consultar el pronóstico de los próximos 7 días de la ciudad default o de otra guardada.

## Stack

- Bun.js
- OpenMeteo

## Ejemplo de petición http:

1. Paso 1: Geocoding API.
2. Paso 2: OpenMeteo API.

```
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=8&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&timezone=auto
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&temperature_unit=celsius&timezone=auto
```

## Inicializar proyecto

```bash
bun install
```

## Ejecutar

```bash
bun start
```

## Pruebas y tipos

```bash
bun test
bun run typecheck
```

Para generar un binario ejecutable:

```bash
bun run build
./dist/weather
```

La configuración (ciudades, ciudad default y unidad) se guarda en `~/.config/weather-cli/config.json`.

### Colores

- El menú y los encabezados se muestran en cyan, las temperaturas en amarillo, las confirmaciones en verde y los errores en rojo.
- Los colores se desactivan solos cuando la salida no es una terminal o cuando existe `NO_COLOR`.
- `--no-color` fuerza la salida sin color y `FORCE_COLOR=1` la fuerza con color (útil al redirigir).
- Las consultas a Open-Meteo muestran un indicador de carga mientras esperan la respuesta.

### Pronóstico de 7 días

La opción **6** muestra el pronóstico de la ciudad default y la **7** permite elegir otra ciudad guardada. La tabla incluye la condición con ícono, la mínima y máxima, una barra que ubica el día dentro del rango de la semana, la probabilidad de lluvia y el viento máximo. Respeta la unidad elegida en Ajustes (°C/°F) y también ajusta viento y precipitación.

### Ejemplo del menú
Esta es la apariencia que deseamos crear

```bash
════════════════════════════════════════
              WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  6. Pronóstico 7 días
  7. Pronóstico 7 días (otra ciudad)
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 6
```
