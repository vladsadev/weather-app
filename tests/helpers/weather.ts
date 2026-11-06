export const currentPayload = {
  current: {
    temperature_2m: 12.3,
    apparent_temperature: 10,
    relative_humidity_2m: 60,
    weather_code: 0,
    wind_speed_10m: 8,
    time: "2026-10-31T12:00",
  },
  current_units: { temperature_2m: "°C", wind_speed_10m: "km/h" },
};

export const forecastPayload = {
  ...currentPayload,
  daily: {
    time: ["2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"],
    temperature_2m_max: [18, 19, 20, 21, 22, 23, 24],
    temperature_2m_min: [8, 9, 10, 11, 12, 13, 14],
  },
};
