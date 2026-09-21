import { FlowScreen } from "@/components/features/FlowScreen";
import { KwikForm } from "@/components/features/KwikForm";
import { Card } from "@/components/ui";

export default function KwikByKey() {
  return <FlowScreen>{(done) => <Card><KwikForm onDone={done} /></Card>}</FlowScreen>;
}
