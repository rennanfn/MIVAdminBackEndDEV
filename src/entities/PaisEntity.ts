import { Connection } from 'mysql2/promise';
import { z } from 'zod';
import { iReturnDefault } from '../utils/ReturnDefault';
import { campoObrigatorio } from './UsuarioEntity';

export interface iPais {
  id_pais: string;
  nome: string;
  status: number /* 0 - Desativado / 1 - Ativado */;
  botao_trocar_senha: string;
  botao_sair: string;
  botao_ajuda: string;
  label_senha_atual?: string;
  label_nova_senha?: string;
  label_confirmar_senha?: string;
  link_botao_ajuda: string;
  logo_miv: string;
  bandeira_imagem: string;
  nome_logo_miv: string;
  nome_bandeira_imagem: string;
  texto_rodape: string;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

export const iPaisZ = z.object({
  id_pais: z.string({ required_error: campoObrigatorio }),
  nome: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'Campo nome não pode ser nulo' })
    .max(100, { message: 'Campo nome deve ter maximo 100 caracteres' }),
  status: z.number().refine((value) => value === 0 || value === 1, {
    message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
  }),
  botao_trocar_senha: z.string({ required_error: campoObrigatorio }).max(100, {
    message: 'Campo botao_trocar_senha deve ter maximo 100 caracteres',
  }),
  botao_sair: z.string({ required_error: campoObrigatorio }).max(100, {
    message: 'Campo botao_sair deve ter maximo 100 caracteres',
  }),
  botao_ajuda: z.string({ required_error: campoObrigatorio }).max(100, {
    message: 'Campo botao_ajuda deve ter maximo 100 caracteres',
  }),
  label_senha_atual: z
    .string({ required_error: campoObrigatorio })
    .max(100, {
      message: 'Campo label_senha_atual deve ter maximo 100 caracteres',
    })
    .optional(),
  label_nova_senha: z
    .string({ required_error: campoObrigatorio })
    .max(100, {
      message: 'Campo label_nova_senha deve ter maximo 100 caracteres',
    })
    .optional(),
  label_confirmar_senha: z
    .string({ required_error: campoObrigatorio })
    .max(100, {
      message: 'Campo label_confirmar_senha deve ter maximo 100 caracteres',
    })
    .optional(),
  link_botao_ajuda: z.string({ required_error: campoObrigatorio }).max(100, {
    message: 'Campo link_botao_ajuda deve ter maximo 100 caracteres',
  }),
  logo_miv: z.string({ required_error: campoObrigatorio }).max(150, {
    message: 'Campo logo_miv deve ter maximo 150 caracteres',
  }),
  bandeira_imagem: z.string({ required_error: campoObrigatorio }).max(150, {
    message: 'Campo bandeira_imagem deve ter maximo 150 caracteres',
  }),
  nome_logo_miv: z.string({ required_error: campoObrigatorio }).max(150, {
    message: 'Campo nome_logo_miv deve ter maximo 150 caracteres',
  }),
  nome_bandeira_imagem: z
    .string({ required_error: campoObrigatorio })
    .max(150, {
      message: 'Campo nome_bandeira_imagem deve ter maximo 150 caracteres',
    }),
  texto_rodape: z.string({ required_error: campoObrigatorio }).max(500, {
    message: 'Campo texto_rodape deve ter maximo 500 caracteres',
  }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});

export abstract class Paises {
  abstract insert(obj: iPais, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iPais, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iPais[]>;
  abstract showAtivo(conn: Connection): Promise<iPais[]>;
  abstract find(id_pais: string, conn: Connection): Promise<iPais[]>;
  abstract ativaDesativa(obj: iPais, conn: Connection): Promise<iReturnDefault>;
}
