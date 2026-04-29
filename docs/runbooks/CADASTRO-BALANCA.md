# Runbook — Cadastro e Diagnóstico de Balança

## Objetivo

Orientar o técnico a cadastrar, testar, diagnosticar e calibrar balanças no módulo de cadastro. O catálogo `IndicadorPesagem` representa o modelo/protocolo reutilizável; a `Balanca` representa o equipamento físico instalado.

## Toledo ou Filizola comum

1. Acesse **Cadastros > Balanças** e clique em **Nova Balança**.
2. Na aba **Geral**, informe nome, unidade e indicador.
3. Na aba **Comunicação**, selecione `Serial` e informe a porta (`COM3`, `COM8` etc.).
4. Confirme os parâmetros herdados do indicador. Toledo Protocolo C e Filizola `@` usam `readMode=polling` com comando `05` (ENQ).
5. Salve, reabra e confira a aba **Protocolo > Configuração efetiva**.
6. Na aba **Diagnóstico**, use **Testar 2s**. Sem hardware, a falha esperada deve ser compreensível.

## RS-232/RS-485

- Configure porta, baud rate, data bits, paridade, stop bits e flow control.
- Use os campos seriais da balança somente quando o equipamento instalado divergir do indicador.
- Para voltar a herdar do indicador, limpe o override com a opção/campo vazio, salvando `null`.

## Conversor TCP/IP

1. Selecione `TCP/IP`.
2. Informe host/IP privado da unidade e porta TCP, normalmente `4001`, `9999`, `10001` ou `23`.
3. Mantenha os parâmetros seriais como metadados quando o conversor serial-Ethernet exigir documentação da origem.
4. Use captura raw com comando hex opcional quando o protocolo for request/response.

## Modbus RTU/TCP

- RTU exige porta serial; TCP exige host e porta.
- Informe `unitId`, `register`, função (`holding` ou `input`), byte/word order, signed, scale e offset.
- Defaults recomendados: função `holding`, scale `1`, offset `0`.

## Diagnóstico sem leitura

1. Verifique status online/offline e última mensagem de erro.
2. Rode **Testar 2s**.
3. Capture bytes raw por 1 a 5 segundos.
4. Se necessário, informe `commandHex=05` para ENQ ou outro comando do fabricante.
5. Teste o parser nos bytes capturados antes de salvar alterações.
6. Ative `debugMode` apenas durante diagnóstico; o dump fica em caminho relativo `logs/balanca-<id>.log`.

## Protocolo desconhecido

1. Abra **Criar protocolo desconhecido** na aba **Protocolo**.
2. Informe fabricante/modelo, cole bytes capturados e configure parser `generic` ou conhecido.
3. Ajuste início, tamanho, marcador, fator e modo de leitura.
4. Teste o parser nos bytes.
5. Salve como indicador customizado e aplique na balança.

## ENQ e polling

- `continuous`: a balança transmite espontaneamente; `readCommandHex` não é necessário.
- `polling`: o sistema envia comando em intervalo; exige comando efetivo, normalmente `05`.
- `manual`: salva o comando, mas não inicia timer automático.
- O fallback legado de ENQ continua ativo para `toledo-c`, `filizola-at` e `filizola-@` quando não houver comando efetivo migrado.

## Calibração

1. Após leitura estável, abra a aba **Calibração**.
2. Use ajuste de leitura quando o parser precisar de fator/divisor.
3. Registre calibração ZERO/SPAN/MULTIPONTO com peso conhecido.
4. Valide no mínimo cinco leituras consecutivas dentro da tolerância do processo.
