import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iCategoriaGeral {
  id_categoria_geral: string;
  titulo?: string;
  status: number;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface iCategoria {
  id_categoria: string;
  titulo: string;
  id_pais: string;
  nome_pais: string;
  status: number;
}

export interface ListaCategorias extends iCategoriaGeral {
  lista_categoria: iCategoria[];
}

export const iCategoriaGeralZ = z.object({
  id_categoria_geral: z.string({ required_error: campoObrigatorio }),
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

export abstract class CategoriasGeral {
  abstract insert(
    obj: iCategoriaGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract update(
    obj: iCategoriaGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iCategoriaGeral[]>;
  abstract showAtivo(conn: Connection): Promise<iCategoriaGeral[]>;
  abstract find(
    id_categoria_geral: string,
    conn: Connection,
  ): Promise<iCategoriaGeral[]>;

  abstract ativaDesativa(
    obj: iCategoriaGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
