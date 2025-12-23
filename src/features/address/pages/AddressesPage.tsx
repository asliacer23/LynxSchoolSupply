import { useAuth } from '@/hooks/useAuth';
import { useAddresses } from '@/hooks/useAddresses';
import { AddressManagement } from '@/features/address/components/AddressManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AddressesPage() {
  const { user } = useAuth();
  const { isLoading, defaultAddress } = useAddresses(user?.id || '');

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to manage your addresses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Address Management</h1>
        <p className="text-muted-foreground">
          Manage your delivery addresses and set a default address for your orders.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <AddressManagement />
        </div>
      )}
    </div>
  );
}
