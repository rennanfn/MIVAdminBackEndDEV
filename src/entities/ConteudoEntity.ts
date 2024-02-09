import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { iReturnDefault } from '../utils/ReturnDefault';
import { Connection, RowDataPacket } from 'mysql2/promise';

export interface iArquivos {
  titulo_botao: string;
  arquivo: string;
  nome_arquivo: string;
}
export interface iConteudo {
  id_conteudo: string;
  id_pais: string;
  id_categoria: string;
  id_marca_geral: string;
  status: number;
  titulo: string;
  imagem_destaque: string;
  nome_imagem_destaque: string;
  texto_conteudo?: string;
  lista_arquivos: iArquivos[];
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

const zArquvivos = z.object({
  titulo_botao: z.string({ required_error: campoObrigatorio }),
  arquivo: z.unknown(),
  nome_arquivo: z.string({ required_error: campoObrigatorio }),
});

export const iConteudoZ = z.object({
  id_conteudo: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  id_categoria: z.string({ required_error: campoObrigatorio }),
  id_marca_geral: z.string({ required_error: campoObrigatorio }),
  status: z
    .number({ required_error: campoObrigatorio })
    .refine((value) => value === 0 || value === 1, {
      message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
    }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo não pode ser nulo' })
    .max(50, { message: 'O campo titulo deve ter no maximo 50 caracateres' }),
  imagem_destaque: z.string({ required_error: campoObrigatorio }),
  nome_imagem_destaque: z.string({ required_error: campoObrigatorio }),
  texto_conteudo: z.string().optional(),
  lista_arquivos: z.array(zArquvivos),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Conteudos {
  abstract insert(obj: iConteudo, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iConteudo, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iConteudo[]>;
  abstract showPaisCategoria(
    obj: iConteudo,
    conn: Connection,
  ): Promise<RowDataPacket[]>;

  abstract showAtivo(conn: Connection): Promise<iConteudo[]>;
  abstract find(id_conteudo: string, conn: Connection): Promise<iConteudo[]>;
  abstract ativaDesativa(
    obj: iConteudo,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
