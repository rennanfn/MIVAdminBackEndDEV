import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iCategoriaLogomarca {
  id_categoria_logomarca: string;
  id_pais: string;
  titulo: string;
  texto_descricao: string;
  status: number;
  id_categoria_logomarca_geral: string;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface ListaCatLogomarca extends iCategoriaLogomarca {
  nome_pais: string;
}

export const iCategoriaLogomarcaZ = z.object({
  id_categoria_logomarca: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo não pode ser nulo' })
    .max(50, { message: 'Campo titulo deve ter no máximo 50 caracteres' }),
  texto_descricao: z
    .string({ required_error: campoObrigatorio })
    .min(1, {
      message: 'O campo texto_descricao não pode ser nulo',
    })
    .max(255, {
      message: 'Campo texto_descricao deve ter no máximo 255 caracteres',
    }),
  status: z.number().refine((value) => value === 0 || value === 1, {
    message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
  }),
  id_categoria_logomarca_geral: z.string({ required_error: campoObrigatorio }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class CategoriaLogomarcas {
  abstract insert(
    obj: iCategoriaLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract update(
    obj: iCategoriaLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iCategoriaLogomarca[]>;
  abstract showPorLogoGer(
    id_categoria_logomarca_geral: string,
    conn: Connection,
  ): Promise<iCategoriaLogomarca[]>;

  abstract showAtivo(conn: Connection): Promise<iCategoriaLogomarca[]>;
  abstract find(
    id_segmento: string,
    conn: Connection,
  ): Promise<iCategoriaLogomarca[]>;

  abstract ativaDesativa(
    obj: iCategoriaLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
