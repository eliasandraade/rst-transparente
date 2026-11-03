# Orken COND — dados pessoais (LGPD)

Controles técnicos e de processo do COND para a Lei 13.709/2018. Não é certificação nem parecer jurídico: cada
condomínio é o controlador dos dados do seu portal; a Andrade Systems opera o sistema (operadora). Bases legais,
avisos aos moradores e prazos finais de guarda são decisões do condomínio com o seu jurídico.

## Inventário

| Dado | Onde | Para quê | Quem vê | Controles |
|---|---|---|---|---|
| Nome, unidade, telefone, e-mail de quem abre demanda | `demands` | Atender e responder a demanda | Equipe do condomínio | Nunca na consulta pública (só protocolo, status, histórico e anexo); RLS por organização |
| Anexo de demanda (foto, PDF) | Cloudinary, entrega `authenticated`, pasta da organização | Evidência da demanda | Equipe; quem tem protocolo e código | Sem URL pública: link assinado de 10 min, gerado na rota autorizada (`lib/files.ts`) |
| Código de acesso da demanda | `demands.accessCode` | Consulta pelo morador | Ninguém | Só o hash bcrypt; consulta com custo e resposta iguais para protocolo inexistente e código errado |
| IP de quem abre demanda ou vota | `demands.ipAddress`, `votos_enquete.ip` | Impedir voto repetido, investigar abuso | Ninguém na interface | Pseudônimo HMAC por organização (`lib/privacy.ts`, `IP_HASH_SECRET`); registros anteriores ao pseudônimo seguem como estavam |
| Navegador de quem abre demanda | `demands.userAgent` | Investigar abuso | Ninguém na interface | — |
| Contas da equipe (nome, e-mail, papel) | `users` | Acesso à gestão | Síndico e MASTER do condomínio | Senha bcrypt; conta vinculada usa a conta Orken (MFA); RLS |
| Sessões e auditoria de acesso | `staff_sessions`, `staff_audit_events` | Segurança | Operação | Só hashes de token; nunca senha, token, código ou segredo |
| Partes de processos | Não armazenado | — | — | A sincronização com o DataJud ignora partes; o portal público mostra o número mascarado |

## Controles transversais

- Isolamento por condomínio no backend e no banco (RLS), provado em teste com dois condomínios.
- Logs sem dados pessoais: erros registrados por tipo e código (`errorSummary`), nunca a mensagem da consulta.
- Rate limit distribuído nas rotas públicas (criação e consulta de demanda, anexo, voto, proposta, login).
- Transporte só HTTPS; cookies `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`.
- Backups com checksum e restauração testada antes de cada migration de produção.

## Direitos do titular

Pedido de acesso, correção ou exclusão chega ao condomínio. Pela gestão, a equipe localiza a demanda pelo protocolo; a
exportação ou exclusão de um registro específico é feita pela operação a pedido formal do condomínio, com registro
do pedido. Exclusão em massa ou automática não existe.

## Pendências de decisão (do condomínio)

- Prazo de guarda de demandas encerradas e de anexos.
- Texto de aviso de privacidade no formulário de demanda.
