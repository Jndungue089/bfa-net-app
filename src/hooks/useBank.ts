import { useMemo, useRef } from "react";
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ApiError, newIdempotencyKey, type Card, type Direction, type Loan, type Receipt, type StatementItem } from "@bfa/shared";
import { bankApi } from "@/lib/api";

// ---------- accounts ----------
export const useAccounts = () => useQuery({ queryKey: ["accounts"], queryFn: () => bankApi.accounts.list() });

export const useAccount = (id: string) =>
  useQuery({ queryKey: ["accounts", id], queryFn: () => bankApi.accounts.get(id) });

export interface StatementFilters { from?: string; to?: string; direction?: Direction }

export function useStatement(accountId: string, filters: StatementFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["statement", accountId, filters, limit],
    queryFn: ({ pageParam }) => bankApi.accounts.statement(accountId, { ...filters, cursor: pageParam, limit }),
    enabled: !!accountId,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
}

// ---------- beneficiaries ----------
export const useBeneficiaries = () => useQuery({ queryKey: ["beneficiaries"], queryFn: () => bankApi.beneficiaries.list() });

export function useAddBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bankApi.beneficiaries.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beneficiaries"] }),
  });
}

export function useRemoveBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankApi.beneficiaries.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beneficiaries"] }),
  });
}

// ---------- cards ----------
export const useCards = () => useQuery({ queryKey: ["cards"], queryFn: () => bankApi.cards.list() });

export type CardPatch = { blocked?: boolean; onlinePurchases?: boolean; contactless?: boolean; atmWithdrawals?: boolean; internationalPayments?: boolean; dailyLimit?: number };

/** The card fields a patch touches (`blocked` maps to `status`). */
const fieldsOf = (p: CardPatch): Partial<Card> => ({
  ...(p.blocked !== undefined && { status: p.blocked ? ("Blocked" as const) : ("Active" as const) }),
  ...(p.onlinePurchases !== undefined && { onlinePurchases: p.onlinePurchases }),
  ...(p.contactless !== undefined && { contactless: p.contactless }),
  ...(p.atmWithdrawals !== undefined && { atmWithdrawals: p.atmWithdrawals }),
  ...(p.internationalPayments !== undefined && { internationalPayments: p.internationalPayments }),
  ...(p.dailyLimit !== undefined && { dailyLimit: p.dailyLimit }),
});

const patchCard = (qc: QueryClient, id: string, fields: Partial<Card>) =>
  qc.setQueryData<Card[]>(["cards"], (old) => old?.map((c) => (c.id === id ? { ...c, ...fields } : c)));

/**
 * Optimistic: the changed field flips instantly, and ONLY that field — no refetch, no other control is touched or
 * disabled. On failure just the fields this call changed are rolled back (so a concurrent change to another toggle
 * survives); on success the server's values for those same fields are kept.
 */
export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CardPatch & { id: string }) => bankApi.cards.update(id, body),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["cards"] });
      const fields = fieldsOf(v);
      const current = qc.getQueryData<Card[]>(["cards"])?.find((c) => c.id === v.id);
      const previous = current ? (Object.fromEntries(Object.keys(fields).map((k) => [k, current[k as keyof Card]])) as Partial<Card>) : {};
      patchCard(qc, v.id, fields);
      return { id: v.id, previous };
    },
    onError: (_e, _v, ctx) => { if (ctx) patchCard(qc, ctx.id, ctx.previous); },
    onSuccess: (server, v) => {
      const keys = Object.keys(fieldsOf(v)) as Array<keyof Card>;
      patchCard(qc, v.id, Object.fromEntries(keys.map((k) => [k, server[k]])) as Partial<Card>);
    },
  });
}

// ---------- public ----------
export const useContacts = () => useQuery({ queryKey: ["contacts"], queryFn: () => bankApi.public.contacts(), staleTime: 60 * 60_000 });
export const useAbout = () => useQuery({ queryKey: ["about"], queryFn: () => bankApi.public.about(), staleTime: 60 * 60_000 });

export const useTransaction = (id: string) => useQuery({ queryKey: ["transaction", id], queryFn: () => bankApi.money.receipt(id), enabled: !!id });

/** All movements in [from, to], following the cursor (capped: 10 pages × 100 rows) — feeds the statement view/export. */
export function useStatementRange(accountId: string, range: { from?: string; to?: string }, enabled = true) {
  return useQuery({
    queryKey: ["statement-range", accountId, range],
    enabled: enabled && !!accountId,
    queryFn: async () => {
      const items: StatementItem[] = [];
      let cursor: number | undefined;
      for (let page = 0; page < 10; page++) {
        const res = await bankApi.accounts.statement(accountId, { ...range, cursor, limit: 100 });
        items.push(...res.items);
        if (res.nextCursor === null) return { items, truncated: false };
        cursor = res.nextCursor;
      }
      return { items, truncated: true };
    },
  });
}

export function useResolveKwik(key: string, enabled: boolean) {
  return useQuery({ queryKey: ["resolve-kwik", key], queryFn: () => bankApi.money.resolveKwik(key), enabled, staleTime: 60_000, retry: false });
}

export const useExchangeRates = () =>
  useQuery({ queryKey: ["fx"], queryFn: () => bankApi.public.exchangeRates(), staleTime: 10 * 60_000 });

export function useResolveIban(iban: string, enabled: boolean) {
  return useQuery({
    queryKey: ["resolve-iban", iban],
    queryFn: () => bankApi.money.resolveIban(iban),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// ---------- money movement ----------
/**
 * One idempotency key per *intent*: it survives retries of the same confirmation (double click, flaky
 * network) so the server can never execute it twice, and is rotated after a definitive outcome.
 */
export function useIdempotencyKey() {
  const ref = useRef<string>(newIdempotencyKey());
  return useMemo(() => ({ current: () => ref.current, rotate: () => { ref.current = newIdempotencyKey(); } }), []);
}

function useMoneyMutation<V, R = Receipt>(run: (key: string, v: V) => Promise<R>) {
  const qc = useQueryClient();
  const key = useIdempotencyKey();
  const mutation = useMutation({
    mutationFn: (v: V) => run(key.current(), v),
    onSuccess: () => {
      key.rotate();
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["statement"] });
      qc.invalidateQueries({ queryKey: ["assistant"] }); // insights and credit depend on the ledger
    },
    onError: (e) => {
      // A definitive server verdict (4xx) closes the intent; network errors keep the key so a retry is safe.
      if (e instanceof ApiError && e.status >= 400) key.rotate();
    },
  });
  return mutation;
}

type TransferBody = Parameters<typeof bankApi.money.transfer>[1];
type ServiceBody = Parameters<typeof bankApi.money.payService>[1];
type RechargeBody = Parameters<typeof bankApi.money.recharge>[1];
type StateBody = Parameters<typeof bankApi.money.payState>[1];
type KwikBody = Parameters<typeof bankApi.money.kwikTransfer>[1];

export const useTransfer = () => useMoneyMutation<TransferBody>((k, v) => bankApi.money.transfer(k, v));
export const usePayService = () => useMoneyMutation<ServiceBody>((k, v) => bankApi.money.payService(k, v));
export const useRecharge = () => useMoneyMutation<RechargeBody>((k, v) => bankApi.money.recharge(k, v));
export const usePayState = () => useMoneyMutation<StateBody>((k, v) => bankApi.money.payState(k, v));
export const useKwikTransfer = () => useMoneyMutation<KwikBody>((k, v) => bankApi.money.kwikTransfer(k, v));

// ---------- financial assistant ----------
export const useInsights = () => useQuery({ queryKey: ["assistant", "insights"], queryFn: () => bankApi.assistant.insights(), staleTime: 30_000 });
export const useCreditOffer = () => useQuery({ queryKey: ["assistant", "credit"], queryFn: () => bankApi.assistant.credit(), staleTime: 30_000 });
export const useLoans = () => useQuery({ queryKey: ["assistant", "loans"], queryFn: () => bankApi.assistant.loans() });

/** Server-computed simulation (rate, fee, instalment); previous result stays on screen while the next one loads. */
export function useCreditSimulation(amount: number, months: number, enabled: boolean) {
  return useQuery({
    queryKey: ["assistant", "simulation", amount, months],
    queryFn: () => bankApi.assistant.simulate(amount, months),
    enabled: enabled && Number.isFinite(amount) && amount > 0 && months > 0,
    placeholderData: keepPreviousData, retry: false, staleTime: 60_000,
  });
}

type AcceptBody = Parameters<typeof bankApi.assistant.accept>[1];
export const useAcceptCredit = () => useMoneyMutation<AcceptBody, Loan>((k, v) => bankApi.assistant.accept(k, v));
export const useRepayLoan = (loanId: string) => useMoneyMutation<{ fromAccountId: string; pin: string }>((k, v) => bankApi.assistant.repay(k, loanId, v));
