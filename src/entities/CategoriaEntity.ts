import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iCategoria {
  id_categoria: string;
  id_pais: string;
  titulo: string;
  status: number;
  id_categoria_geral: string;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface PaisNomes extends iCategoria {
  nome_pais: string;
  nome_categoria_geral: string;
}

export const iCategoriaZ = z.object({
  id_categoria: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
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

export abstract class Categorias {
  abstract insert(obj: iCategoria, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iCategoria, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iCategoria[]>;
  abstract showPorPais(
    id_pais: string,
    conn: Connection,
  ): Promise<iCategoria[]>;

  abstract showAtivo(conn: Connection): Promise<iCategoria[]>;
  abstract find(id_categoria: string, conn: Connection): Promise<iCategoria[]>;
  abstract ativaDesativa(
    obj: iCategoria[],
    conn: Connection,
  ): Promise<iReturnDefault[]>;
}
