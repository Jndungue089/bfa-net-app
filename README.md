# BFA NET — Mobile (Expo / React Native)

App móvel do internet banking. Expo SDK 57, **expo-router** (rotas por ficheiros), TypeScript, **React Hook Form + Zod**, **zustand**, **TanStack Query**.
Liga-se ao backend por HTTPS com **Bearer**; o código de domínio (schemas, regex, cliente, QR, períodos) vem de [`@bfa/shared`](../../packages/shared).

> O Expo muda de API entre versões. Antes de mexer em módulos do Expo/RN, consultar a documentação da versão instalada (`https://docs.expo.dev/versions/v57.0.0/`) — ver `AGENTS.md`.

## Requisitos de execução
- **Emulador/telemóvel** e `EXPO_PUBLIC_API_URL` (por omissão `https://bfa-api.josemarsilva.me`): emulador Android `http://10.0.2.2:5080`, simulador iOS `http://localhost:5080`, telemóvel físico `http://<IP-da-LAN>:5080` (ver `.env.example`). **Em builds de release a app recusa URLs que não sejam `https://`** (`src/lib/config.ts`).
- **Face ID / Touch ID / cofre protegido por biometria não funcionam no Expo Go** → usar *development build* (`npx expo run:ios|android` ou EAS). Câmara, PDF e WebView funcionam em ambos.
- `pnpm dev:mobile` (da raiz) ou `pnpm start` nesta pasta · `pnpm typecheck`.

## Arquitectura

```
app/  (expo-router: cada ficheiro é uma rota)
  _layout.tsx        Providers + guardas de sessão (Stack.Protected) + cortina de privacidade
  (auth)/            login · unlock (bloqueio biométrico)
  (tabs)/            index (Resumo) · services · assistant · cards · profile   ← 5 separadores
  pay/               fluxos de Serviços (stack próprio, com cabeçalho)
      services → reference · state · recharges/index → [provider] · qr · transfers/index → iban · kwik/(index · key · qr)
  statement · transaction/[id] · account/[id] · beneficiaries · security · biometrics · about · contacts
src/
  components/ui/         Text (T), Button, IconButton, Icon, Card, Notice, Screen, Sheet (gaveta inferior), form.tsx (campos RHF), Money, BrandLockup
  components/features/   BankCard, CardSettingsSheet, PinSheet, KwikForm, QrPurchaseForm, QrScanner, PaymentForms, TransferForm, ReceiptView, …
  hooks/                 useBank (dados) · useAuth · useAvatar · useBiometric* · useSessionLifecycle · useSecureScreen
  lib/                   api (cliente + sessão) · biometricStore · secureStorage · pdfShare + receiptShare (PDFs do backend) · avatarUpload · config
  stores/                session (token em memória) · privacy
  theme.ts               cores, raios e a fonte serifada
```

### Sessão e armazenamento
| Dado | Onde | Notas |
|---|---|---|
| Access token (10 min) | **memória** (`zustand`, nunca persistido) | descartado ao bloquear |
| Refresh token | Keychain/Keystore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) | rotativo; uma reutilização revoga a sessão |
| Credencial biométrica | item protegido (`requireAuthentication`, só com passcode) | o SO só a liberta após o sensor |
| PIN para compras (opcional) | item protegido pelo sensor | validado pelo servidor a cada operação |
| Preferências biométricas / nº de adesão | Keychain sem prompt | não secretos |
| Ficheiros PDF partilhados | cache privada, 1 pasta | apagada antes de cada exportação, no logout e no arranque |

- **Arranque**: sem refresh guardado → login; com refresh → ecrã de desbloqueio (biometria) em vez de entrar em silêncio.
- **Bloqueio automático**: depois de 60 s em segundo plano o token em memória é descartado e pede-se biometria. **Cortina de privacidade** cobre a UI quando a app não está activa (seletor de apps). **Bloqueio de capturas** (`useSecureScreen`: `FLAG_SECURE` no Android) nas áreas autenticadas.
- **Cliente**: refresh *single-flight* em 401; `endSession` limpa Keychain, cache e ficheiros.
- **Links profundos**: parâmetros de rota são tratados como não confiáveis (ex.: `recharges/[provider]` só aceita fornecedores conhecidos).

### Funcionalidades
- **Serviços** — cartão em cima e grelha: *Pagamento de serviços* (subtela → por referência), *Pagamentos ao Estado* (13 dígitos), *Carregamentos* (Unitel, Africell, DStv, ZAP, ENDE com os logos), *Compra com QR Code*, *Transferências* (subtela: **IBAN** ou **KWiK** → chave/QR). Todas passam por `PinSheet`.
- **QR**: `expo-camera` (`CameraView`) + entrada manual; só payloads que passam o parser estrito do `shared`. O nome do QR é rotulado "não verificado"; mostra-se o titular resolvido pelo servidor.
- **Assistente** (separador *Assistente*): medidor de saúde financeira, indicadores, alertas, poupança sugerida (`SaveSheet` → `PinSheet`), barras de rendimento/gastos com valores nas barras (sem *hover* em toque), categorias, recorrentes e `CreditPanel` (simulador com chips de montante/prazo, simulação no servidor, PIN, plano e pagamento de prestações). Respeita «ocultar saldos». Sem dependência de *slider*.
- **Cartões** — `BankCard` na **cor primária do BFA** (laranja; navy no pré-pago), com chip e contactless, e a *sheet* de definições com **atualização otimista** (só o interruptor tocado muda; nada é refeito nem desativado; falha → reverte esse campo e mostra aviso; a lógica é `useUpdateCard`, partilhada com a web) + botão **Definições do cartão** que abre uma *sheet*: canais, limite e bloquear.
- **Biometria** (Segurança → *Biometria*): interruptor **geral**, **login com biometria** (pede a palavra-passe uma vez; regista uma credencial de dispositivo revogável) e **compras e pagamentos** (pede o PIN uma vez, valida-o com `verify-pin` e guarda-o atrás do sensor; o `PinSheet` oferece "Confirmar com Face ID/impressão digital"). O nome do sensor adapta-se (Face ID / Touch ID / impressão digital / reconhecimento facial). Mudar a palavra-passe ou o PIN invalida a configuração.
- **Extracto** (`statement`): conta, período (mês/30/90/personalizado com validação), sumário e **exportar PDF** — emitido pelo **backend** (`statement.pdf`), descarregado para a pasta privada e partilhado (`shareBackendPdf`). A app não gera PDFs (`expo-print` foi removido).
- **Detalhe da transação**: ícone por tipo, estado e campos, e **partilhar o comprovativo em PDF**: o PDF é **emitido pelo backend** (`receipt.pdf`, com logo, ordenante e conta) e descarregado por streaming nativo (`File.downloadFileAsync`, com Bearer e um refresh+repetição) para a pasta privada, e só então abre a partilha (`lib/receiptShare.ts`). O mesmo botão existe no recibo depois de cada operação. Não há "copiar referência".
- **Perfil**: fotografia (única edição permitida); "Terminar sessão" a vermelho. O seletor da galeria não faz recorte no SO (o servidor recorta) e o upload usa o **envio nativo multipart** do `expo-file-system` (`File.upload`, a partir do disco, sem `Blob`/`FormData`, com Bearer e um refresh+repetição); o **backend** valida, recorta, redimensiona e re-codifica. A mensagem de erro do servidor é mostrada. Restantes dados só de leitura.
- **Sobre o BFA**: `react-native-webview` restrita a `https://www.bfa.ao/` (`onShouldStartLoadWithRequest`, sem cookies/DOM storage, sem abrir janelas), com CSS injectado que esconde o cabeçalho, menus e rodapé do site para parecer parte da app. **Contactos**: da API; só abre `tel:`, `mailto:` e `https://www.bfa.ao`.

### Convenções
- **Ícones em vez de palavras** nas acções secundárias (`IconButton` exige `label`: é o nome acessível). Sem emojis.
- **Tipografia serifada** (`fonts.regular`: Times New Roman no iOS, `serif` no Android).
- Campos numéricos higienizam ao escrever (`sanitize`) — nunca dependem de `maxLength`.
- `src/hooks/useBank.ts` é a mesma fonte que `apps/web/src/hooks/useBank.ts` (copiada, porque partilhar hooks com `react` por um pacote arriscaria duas cópias de React de versões diferentes). **Alterar num, copiar para o outro.**
- Componentes de fluxo: `FlowScreen` mostra o recibo e volta à grelha (`router.dismissAll()`).

## Verificação feita e o que falta
Feito: `tsc`, empacotamento com o Metro (`expo export --platform android`) e revisão visual dos ecrãs via `react-native-web` (com *shim* temporário do armazenamento seguro, entretanto removido). **Não exercitado num dispositivo real:** câmara/QR, biometria, PDF/partilha, WebView. Antes de produção: *certificate pinning*, deteção de root/jailbreak e teste em dispositivos.
