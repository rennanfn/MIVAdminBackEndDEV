import { Connection } from 'mysql2/promise';
import { z } from 'zod';
import { iReturnDefault } from '../utils/ReturnDefault';
import { iUsuarioPais } from './UsuarioPaisEntity';

export const campoObrigatorio = `obrigatório`;
export interface iUsuario {
  id_usuario: string;
  email: string;
  status: number;
  nome: string;
  senha: string;
  senhaTemp?: string;
  id_filial: string;
  responsavel: string;
  telefone: string;
  lista_pais: iUsuarioPais[];
  acesso_admin: number;
  acesso_user: number;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
}

const zPais = z.object({
  id_pais: z.string(),
  id_usuario: z.string(),
});

export const iUsuarioZ = z.object({
  id_usuario: z.string({ required_error: campoObrigatorio }),
  email: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'Campo email não pode ser nulo' })
    .max(50, { message: 'Campo email deve ter no máximo 50 caracteres' }),
  nome: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'Campo nome deve ter no mínimo 1 caracter' })
    .max(100, { message: 'Campo nome deve ter no máximo 100 caracteres' }),
  status: z
    .number({ required_error: campoObrigatorio })
    .refine((value) => value === 0 || value === 1, {
      message: 'Campo status: Caracter inválido. O valor deve ser 0 ou 1',
    }),
  senha: z.string({ required_error: campoObrigatorio }),
  senhaTemp: z.string({ required_error: campoObrigatorio }).optional(),
  id_filial: z.string({ required_error: campoObrigatorio }),
  responsavel: z
    .string({ required_error: campoObrigatorio })
    .min(1, { message: 'Campo responsavel não pode ser nulo' })
    .max(100, {
      message: 'Campo responsavel deve ter no máximo 100 caracteres',
    }),
  telefone: z.string({ required_error: campoObrigatorio }),
  lista_pais: z.array(zPais), // Chama a validação zPais para garantir que contem campos obrigatórios da interface iUsuarioPais
  acesso_admin: z
    .number({ required_error: campoObrigatorio })
    .refine((value) => value === 0 || value === 1, {
      message: 'Campo acesso_admin: Caracter inválido. O valor deve ser 0 ou 1',
    }),
  acesso_user: z
    .number({ required_error: campoObrigatorio })
    .refine((value) => value === 0 || value === 1, {
      message: 'Campo acesso_user: Caracter inválido. O valor deve ser 0 ou 1',
    }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
});
export abstract class Usuarios {
  abstract insert(obj: iUsuario, conn: Connection): Promise<iReturnDefault>;
  abstract update(obj: iUsuario, conn: Connection): Promise<iReturnDefault>;
  abstract show(conn: Connection): Promise<iUsuario[]>;
  abstract find(id_usuario: string, conn: Connection): Promise<iUsuario>;
  abstract ativaDesativa(
    obj: iUsuario,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract findLogin(email: string, conn: Connection): Promise<iUsuario[]>;
}
