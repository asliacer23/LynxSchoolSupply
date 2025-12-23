import { useAuth } from '@/hooks/useAuth';
import { AddressList } from './AddressList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AddressManagement() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please log in to manage addresses</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Address Management</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressList userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
