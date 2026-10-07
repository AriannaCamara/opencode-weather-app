export class WeatherError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WeatherError";
  }
}

export async function fetchJson(url: string, subject: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new WeatherError(`No se pudo consultar ${subject}. Revisá tu conexión a internet.`, { cause: error });
  }

  if (!response.ok) {
    throw new WeatherError(`Open-Meteo respondió con error ${response.status} al consultar ${subject}.`);
  }

  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new WeatherError(`La respuesta de ${subject} no es un JSON válido.`, { cause: error });
  }
}
