import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';
import { iMarcaCategoria } from './MarcaCategoriaEntity';

export interface iMarca {
  id_marca: string;
  id_pais: string;
  id_segmento: string;
  titulo: string;
  status: number;
  cor_botao: string;
  cor_texto: string;
  logo_botao: string;
  logo_miniatura: string;
  nome_logo_botao: string;
  nome_logo_miniatura: string;
  id_marca_geral: string;
  lista_categorias: iMarcaCategoria[];
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

const zCategoria = z.object({
  id_categoria: z.string({ required_error: campoObrigatorio }),
  id_marca: z.string({ required_error: campoObrigatorio }),
});

export const iMarcaZ = z.object({
  id_marca: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  id_segmento: z.string({ required_error: campoObrigatorio }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo não pode ser nulo' })
    .max(50, { message: 'Campo titulo deve ter no máximo 50 caracteres' }),
  status: z.number().refine((value) => value === 0 || value === 1, {
    message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
  }),
  cor_botao: z.string({ required_error: campoObrigatorio }),
  cor_texto: z.string({ required_error: campoObrigatorio }),
  logo_botao: z.string({ required_error: campoObrigatorio }),
  logo_miniatura: z.string({ required_error: campoObrigatorio }),
  nome_logo_botao: z.string({ required_error: campoObrigatorio }),
  nome_logo_miniatura: z.string({ required_error: campoObrigatorio }),
  id_marca_geral: z.string({ required_error: campoObrigatorio }),
  lista_categorias: z.array(zCategoria),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Marcas {
  abstract insert(obj: iMarca, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iMarca, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iMarca[]>;
  abstract showPais(
    id_marca_geral: string,
    conn: Connection,
  ): Promise<iMarca[]>;

  abstract showCategoria(
    id_marca_geral: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iMarca[]>;

  abstract showPorMarcaGeral(
    id_marca_geral: string,
    conn: Connection,
  ): Promise<iMarca[]>;

  abstract showAtivo(conn: Connection): Promise<iMarca[]>;
  abstract find(id_marca: string, conn: Connection): Promise<iMarca>;
  abstract ativaDesativa(
    marcas: iMarca[],
    conn: Connection,
  ): Promise<iReturnDefault[]>;
}
