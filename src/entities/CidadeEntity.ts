import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { iReturnDefault } from '../utils/ReturnDefault';
import { Connection } from 'mysql2/promise';

export interface iCidade {
  id_cidade: string;
  id_estado: string;
  nome: string;
}

export interface EstadoNome extends iCidade {
  nome_estado: string;
}

export const iCidadeZ = z.object({
  id_cidade: z.string({ required_error: campoObrigatorio }),
  id_estado: z.string({ required_error: campoObrigatorio }),
  nome: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'Campo nome não pode ser nulo' })
    .max(100, { message: 'Campo nome deve ter no máximo 100 caracteres' }),
});

export abstract class Cidades {
  abstract insert(obj: iCidade, conn: Connection): Promise<iReturnDefault>;
  abstract showCidadeEstado(
    id_estado: string,
    conn: Connection,
  ): Promise<iCidade[]>;

  abstract find(nome: string, conn: Connection): Promise<iCidade[]>;
}
