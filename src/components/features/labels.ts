import type { AccountType, TransactionKind } from "@bfa/shared";
import type { IconName } from "@/components/ui";

export const kindLabel: Record<TransactionKind, string> = {
  Transfer: "Transferência", ServicePayment: "Pagamento de serviços", TopUp: "Carregamento", StatePayment: "Pagamento ao Estado", Deposit: "Depósito", Fee: "Comissão", Loan: "Microcrédito", LoanRepayment: "Prestação de microcrédito",
};
export const kindIcon: Record<TransactionKind, IconName> = {
  Transfer: "swap-horizontal", ServicePayment: "receipt-outline", TopUp: "phone-portrait-outline", StatePayment: "business-outline", Deposit: "download-outline", Fee: "pricetag-outline", Loan: "cash-outline", LoanRepayment: "cash-outline",
};
export const accountTypeLabel: Record<AccountType, string> = { Ordem: "Conta à Ordem", Ordenado: "Conta Ordenado", Poupanca: "Conta Poupança", Bankita: "Conta Bankita", Interna: "Interna" };
