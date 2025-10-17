import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Payment history and receipt uploads (for parents) or payment confirmation (for admins) will be implemented here.</p>
      </CardContent>
    </Card>
  );
}
