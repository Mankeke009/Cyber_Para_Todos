export type Foto = { src: string; alt: string };

export type Colegio = {
  name: string;
  place: string;
  lat: number;
  lng: number;
  /**
   * Foto de portada (primer plano del colegio). Aparece arriba en la tarjeta del mapa.
   * Ejemplo: coverPhoto: { src: "/colegios/liceo-valpo/portada.jpg", alt: "Fachada del Liceo Bicentenario" }
   */
  coverPhoto?: Foto;
  /**
   * Fotos de la visita (equipo, exposición, etc.). Se muestran como una tira que se desplaza
   * y un botón "Ver álbum completo". Mientras falten, la tarjeta no muestra nada de esto.
   * Ejemplo: photos: [{ src: "/colegios/liceo-valpo/1.jpg", alt: "El equipo presentando en el aula" }]
   */
  photos?: Foto[];
};

// Cat?logo y coordenadas existentes. Drive aporta solo las fotos mediante
// una correspondencia expl?cita de carpetas en server/config.local.json.
export const colegios: Colegio[] = [
  { name: "Liceo Bicentenario Valparaíso", place: "Valparaíso", lat: -33.0472, lng: -71.6127 },
  { name: "Colegio San Ignacio", place: "Santiago", lat: -33.45, lng: -70.6667 },
  { name: "Escuela Villa Alemana", place: "Villa Alemana", lat: -33.0422, lng: -71.3742 },
  { name: "Liceo Enrique Molina", place: "Concepción", lat: -36.8269, lng: -73.0498 },
  { name: "Colegio Cruz del Norte", place: "Antofagasta", lat: -23.6509, lng: -70.3975 },
];
