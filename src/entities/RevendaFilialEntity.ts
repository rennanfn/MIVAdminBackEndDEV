import { Connection } from 'mysql2/promise';
import { z } from 'zod';
import { iReturnDefault } from '../utils/ReturnDefault';
import { campoObrigatorio } from './UsuarioEntity';

export interface iRevendaFilial {
  id_revenda_filial: string;
  id_pais: string;
  id_segmento: string;
  titulo: string;
  status: number;
  cor_texto: string;
  logo_botao: string;
  nome_logo_botao: string;
  id_revenda_filial_geral: string;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export const iRevendaFilialZ = z.object({
  id_revenda_filial: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  id_segmento: z.string({ required_error: campoObrigatorio }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo não pode ser nulo' })
    .max(50, { message: 'Campo titulo deve ter no máximo 50 caracteres' }),
  status: z.number().refine((value) => value === 0 || value === 1, {
    message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
  }),
  cor_texto: z.string({ required_error: campoObrigatorio }),
  logo_botao: z.string({ required_error: campoObrigatorio }),
  nome_logo_botao: z.string({ required_error: campoObrigatorio }),
  id_revenda_filial_geral: z.string({ required_error: campoObrigatorio }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Revendas {
  abstract insert(
    obj: iRevendaFilial,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract update(
    obj: iRevendaFilial,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iRevendaFilial[]>;
  abstract showPais(
    id_revenda_filial_geral: string,
    conn: Connection,
  ): Promise<iRevendaFilial[]>;

  abstract showAtivo(conn: Connection): Promise<iRevendaFilial[]>;
  abstract find(
    id_revenda_filial: string,
    conn: Connection,
  ): Promise<iRevendaFilial>;

  abstract ativaDesativa(
    marcas: iRevendaFilial[],
    conn: Connection,
  ): Promise<iReturnDefault[]>;
}
