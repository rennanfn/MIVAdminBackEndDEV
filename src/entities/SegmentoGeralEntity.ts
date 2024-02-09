import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iSegmentoGeral {
  id_segmento_geral: string;
  titulo: string;
  status: number;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export interface iSegmento {
  id_segmento: string;
  titulo: string;
  id_pais: string;
  nome_pais: string;
  status: number;
}

export interface ListaSegmentos extends iSegmentoGeral {
  lista_segmento: iSegmento[];
}

export const iSegmentoGeralZ = z.object({
  id_segmento_geral: z.string({ required_error: campoObrigatorio }),
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

export abstract class SegmentosGeral {
  abstract insert(
    obj: iSegmentoGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract update(
    obj: iSegmentoGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iSegmentoGeral[]>;
  abstract showAtivo(conn: Connection): Promise<iSegmentoGeral[]>;
  abstract find(
    id_categoria_geral: string,
    conn: Connection,
  ): Promise<iSegmentoGeral[]>;

  abstract ativaDesativa(
    obj: iSegmentoGeral,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
