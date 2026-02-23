# Certificados digitais

Coloque aqui o ficheiro `assinatura.p12` para assinatura digital de faturas PDF.

## Configuração

- **Ficheiro esperado:** `assinatura.p12`
- **Alternativa:** Defina a variável de ambiente `CERT_PATH` com o caminho completo
- **Password:** Se o certificado tiver password, defina `CERT_PASSWORD` nas variáveis de ambiente

## Uso

Ao criar uma fatura com `assinarPdf: true`, o PDF será assinado automaticamente:

```ts
const result = await createInvoice({
  emitente: {...},
  cliente: {...},
  itens: [...],
  assinarPdf: true,
});
```
