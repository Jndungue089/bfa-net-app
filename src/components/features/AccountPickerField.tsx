import { useEffect } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { formatMoney, type Account } from "@bfa/shared";
import { FormPicker } from "@/components/ui";
import { accountTypeLabel } from "./labels";

export function AccountPickerField<F extends FieldValues>({ control, name, accounts, onDefault }: { control: Control<F, any, any>; name: Path<F>; accounts?: Account[]; onDefault: (id: string) => void }) {
  useEffect(() => {
    const first = accounts?.find((a) => a.type === "Ordem" && a.status === "Active") ?? accounts?.find((a) => a.status === "Active");
    if (first) onDefault(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);
  return (
    <FormPicker control={control} name={name} label="Conta de origem"
      options={(accounts ?? []).filter((a) => a.status === "Active").map((a) => ({ value: a.id, label: a.nickname ?? accountTypeLabel[a.type], sub: formatMoney(a.balance, a.currency) }))} />
  );
}
