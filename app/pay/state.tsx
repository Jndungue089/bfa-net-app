import { FlowScreen } from "@/components/features/FlowScreen";
import { StatePaymentForm } from "@/components/features/PaymentForms";
import { Card } from "@/components/ui";

export default function StatePayment() {
  return <FlowScreen>{(done) => <Card><StatePaymentForm onDone={done} /></Card>}</FlowScreen>;
}
