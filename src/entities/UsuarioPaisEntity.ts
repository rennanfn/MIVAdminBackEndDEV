import { Connection } from 'mysql2/promise';
import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iUsuarioPais {
  id_usuario_pais?: string;
  id_usuario: string;
  id_pais: string;
  nome_pais?: string;
}

export const iUsuarioPaisZ = z.object({
  id_usuario_pais: z.string(),
  id_usuario: z.string({ required_error: campoObrigatorio }),
  id_pais: z.string({ required_error: campoObrigatorio }),
});

export abstract class UsuarioPaises {
  abstract insert(
    idUsuario: string,
    idsPais: iUsuarioPais[],
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract delete(
    id_usuario: string,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract find(id_usuario: string, conn: Connection): Promise<iUsuarioPais[]>;
}
