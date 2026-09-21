import { FlowScreen } from "@/components/features/FlowScreen";
import { ServicePaymentForm } from "@/components/features/PaymentForms";
import { Card } from "@/components/ui";

export default function ReferencePayment() {
  return <FlowScreen>{(done) => <Card><ServicePaymentForm onDone={done} /></Card>}</FlowScreen>;
}
