export type ErroType = 0 | 1;

export interface iReturnDefaultInt {
  retorno: {
    erro: ErroType;
    mensagem: string;
  };
}

export abstract class iReturnDefault implements iReturnDefaultInt {
  retorno!: { erro: ErroType; mensagem: string };
}

export default function returnDefault(
  erro: ErroType,
  mensagem: string,
): iReturnDefault {
  return {
    retorno: {
      erro,
      mensagem,
    },
  } as iReturnDefault;
}
