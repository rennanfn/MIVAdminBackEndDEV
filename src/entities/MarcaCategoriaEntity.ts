import { z } from 'zod';
import { campoObrigatorio } from './UsuarioEntity';
import { Connection } from 'mysql2/promise';
import { iReturnDefault } from '../utils/ReturnDefault';

export interface iMarcaCategoria {
  id_marca_categoria?: string;
  id_marca: string;
  id_categoria: string;
  nome_categoria?: string;
}

export const iMarcaCategoriaZ = z.object({
  id_marca_categoria: z.string({ required_error: campoObrigatorio }),
  id_marca: z.string({ required_error: campoObrigatorio }),
  id_categoria: z.string({ required_error: campoObrigatorio }),
});

export abstract class MarcaCategoria {
  abstract insert(
    idMarca: string,
    idsCategoria: iMarcaCategoria[],
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract delete(id_marca: string, conn: Connection): Promise<iReturnDefault>;

  abstract find(id_marca: string, conn: Connection): Promise<iMarcaCategoria[]>;
}
