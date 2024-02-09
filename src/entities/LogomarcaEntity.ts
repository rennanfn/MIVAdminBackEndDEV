import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { iReturnDefault } from '../utils/ReturnDefault';
import { Connection } from 'mysql2/promise';

export interface iArquivosDownload {
  titulo_botao: string;
  arquivo: string;
  nome_arquivo: string;
}

export interface iCores {
  cor: string;
  descricao: string;
  legenda_cor: string;
}

export interface iLogomarca {
  id_logomarca: string;
  id_marca_geral: string;
  id_categoria_logomarca: string;
  id_pais: string;
  titulo: string;
  subtitulo: string;
  texto_logomarca: string;
  status: number;
  lista_arquivos: iArquivosDownload[];
  cores: iCores[];
  imagem_destaque: string;
  nome_imagem_destaque: string;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

const zArquvivosDownload = z.object({
  titulo_botao: z.string({ required_error: campoObrigatorio }),
  arquivo: z.unknown(),
  nome_arquivo: z.string({ required_error: campoObrigatorio }),
});

const zCores = z.object({
  cor: z.string({ required_error: campoObrigatorio }),
  descricao: z.string({ required_error: campoObrigatorio }),
  legenda_cor: z.string({ required_error: campoObrigatorio }),
});

export const iLogomarcaZ = z.object({
  id_logomarca: z.string({ required_error: campoObrigatorio }),
  id_marca_geral: z.string({ required_error: campoObrigatorio }),
  id_categoria_logomarca: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
  titulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo deve ter no minimo 1 caracter' })
    .max(50, { message: 'O campo titulo deve ter no maximo 50 caracateres' }),
  subtitulo: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'O campo titulo deve ter no minimo 1 caracter' })
    .max(50, { message: 'O campo titulo deve ter no maximo 50 caracateres' }),
  status: z
    .number({ required_error: campoObrigatorio })
    .refine((value) => value === 0 || value === 1, {
      message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
    }),
  lista_arquivos: z.array(zArquvivosDownload),
  cores: z.array(zCores),
  imagem_destaque: z.string(),
  nome_imagem_destaque: z.string(),
  texto_logomarca: z.string(),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Logomarcas {
  abstract insert(obj: iLogomarca, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iLogomarca, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iLogomarca[]>;
  abstract showAtivo(conn: Connection): Promise<iLogomarca[]>;
  abstract find(id_logomarca: string, conn: Connection): Promise<iLogomarca>;
  abstract ativaDesativa(
    obj: iLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault>;
}
