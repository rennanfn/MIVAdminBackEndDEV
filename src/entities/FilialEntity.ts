import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iFilial {
  id_filial: string;
  nome: string;
  id_cidade: string;
  id_estado: string;
  id_pais: string;
  status: number;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export const iFilialZ = z.object({
  id_filial: z.string({ required_error: campoObrigatorio }),
  nome: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'Campo nome não pode ser nulo' })
    .max(100, { message: 'Campo nome deve ter no máximo 100 caracteres' }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  id_estado: z.string({ required_error: campoObrigatorio }),
  id_cidade: z.string({ required_error: campoObrigatorio }),
  status: z
    .number({ required_error: campoObrigatorio })
    .refine((value) => value === 0 || value === 1, {
      message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
    }),

  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Filiais {
  abstract insert(obj: iFilial, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iFilial, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iFilial[]>;
  abstract showAtivo(conn: Connection): Promise<iFilial[]>;
  abstract find(id_filial: string, conn: Connection): Promise<iFilial[]>;
  abstract ativaDesativa(
    obj: iFilial,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
