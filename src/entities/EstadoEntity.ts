import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { iReturnDefault } from '../utils/ReturnDefault';
import { Connection } from 'mysql2/promise';

export interface iEstado {
  id_estado: string;
  nome: string;
  id_pais: string;
}

export const iEstadoZ = z.object({
  id_estado: z.string({ required_error: campoObrigatorio }),
  nome: z
    .string({ required_error: campoObrigatorio })
    .length(2, { message: 'Campo nome deve ter 2 caracteres' }),
  id_pais: z.string({ required_error: campoObrigatorio }),
});

export abstract class Estados {
  abstract insert(obj: iEstado, conn: Connection): Promise<iReturnDefault>;
  abstract showEstadoPais(
    id_pais: string,
    conn: Connection,
  ): Promise<iEstado[]>;

  abstract find(
    nome: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iEstado[]>;
}
