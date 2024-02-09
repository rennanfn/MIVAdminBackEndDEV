import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iSegmento {
  id_segmento: string;
  id_pais: string;
  titulo: string;
  status: number;
  id_segmento_geral: string;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface PaisNomes extends iSegmento {
  nome_pais: string;
}

export const iSegmentoZ = z.object({
  id_segmento: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo não pode ser nulo' })
    .max(50, { message: 'Campo titulo deve ter no máximo 50 caracteres' }),
  status: z.number().refine((value) => value === 0 || value === 1, {
    message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
  }),
  id_segmento_geral: z.string({ required_error: campoObrigatorio }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Segmentos {
  abstract insert(obj: iSegmento, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iSegmento, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iSegmento[]>;
  abstract showAtivo(conn: Connection): Promise<iSegmento[]>;
  abstract find(id_segmento: string, conn: Connection): Promise<iSegmento[]>;
  abstract ativaDesativa(
    segmentos: iSegmento[],
    conn: Connection,
  ): Promise<iReturnDefault[]>;
}
