import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iRevendaFilialGeral {
  id_revenda_filial_geral: string;
  titulo: string;
  status: number;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface iRevendasFiliais {
  id_revenda_filial: string;
  titulo: string;
  id_pais: string;
  nome_pais: string;
  status: number;
}

export interface ListaRevendas extends iRevendaFilialGeral {
  lista_revendas: iRevendasFiliais[];
}

export const iRevendaFilialGeralZ = z.object({
  id_revenda_filial_geral: z.string({ required_error: campoObrigatorio }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo não pode ser nulo' })
    .max(50, { message: 'Campo titulo deve ter no máximo 50 caracteres' }),
  status: z.number().refine((value) => value === 0 || value === 1, {
    message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
  }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class RevendasGeral {
  abstract insert(
    obj: iRevendaFilialGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract update(
    obj: iRevendaFilialGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iRevendaFilialGeral[]>;
  abstract showAtivo(conn: Connection): Promise<iRevendaFilialGeral[]>;
  abstract find(
    id_revenda_filial_geral: string,
    conn: Connection,
  ): Promise<iRevendaFilialGeral[]>;

  abstract ativaDesativa(
    obj: iRevendaFilialGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
