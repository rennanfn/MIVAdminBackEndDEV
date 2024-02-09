import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iMarcaGeral {
  id_marca_geral: string;
  titulo: string;
  status: number;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface iMarca {
  id_marca: string;
  titulo: string;
  id_pais: string;
  nome_pais: string;
  status: number;
}

export interface ListaMarcas extends iMarcaGeral {
  lista_marcas: iMarca[];
}

export const iMarcaGeralZ = z.object({
  id_marca_geral: z.string({ required_error: campoObrigatorio }),
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

export abstract class MarcasGeral {
  abstract insert(obj: iMarcaGeral, conn: Connection): Promise<iReturnDefault>;

  abstract update(obj: iMarcaGeral, conn: Connection): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iMarcaGeral[]>;
  abstract showAtivo(conn: Connection): Promise<iMarcaGeral[]>;
  abstract find(
    id_marca_geral: string,
    conn: Connection,
  ): Promise<iMarcaGeral[]>;

  abstract ativaDesativa(
    obj: iMarcaGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
