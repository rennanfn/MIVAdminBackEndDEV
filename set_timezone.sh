#!/bin/sh
 
# Verifica se a variável de ambiente TZ está definida
if [ -z "$TZ" ]; then
    echo "A variável de ambiente TZ não está definida. Não é possível configurar o fuso horário."
    exit 1
fi
 
# Configura o fuso horário
ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
echo $TZ > /etc/timezone
 
# Exibe o fuso horário configurado
echo "Fuso horário configurado para: $TZ"