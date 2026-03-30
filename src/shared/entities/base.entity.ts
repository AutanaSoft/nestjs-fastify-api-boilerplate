/**
 * Entidad base para todos los modelos del dominio.
 * Proporciona campos comunes como ID y fechas de auditoría.
 */
export abstract class BaseEntity {
  /**
   * Crea una instancia de BaseEntity.
   * @param id Identificador único de la entidad.
   * @param createdAt Fecha de creación (por defecto la fecha actual).
   * @param updatedAt Fecha de última actualización (por defecto la fecha actual).
   */
  constructor(
    readonly id: string,
    readonly createdAt: Date = new Date(),
    readonly updatedAt: Date = new Date(),
  ) {}
}
