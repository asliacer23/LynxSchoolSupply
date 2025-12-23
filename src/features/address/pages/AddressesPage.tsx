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
          {defaultAddress && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Default Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {defaultAddress.recipient_name && (
                    <p className="font-medium">{defaultAddress.recipient_name}</p>
                  )}
                  <p>{defaultAddress.address_line1}</p>
                  {defaultAddress.address_line2 && (
                    <p>{defaultAddress.address_line2}</p>
                  )}
                  <p>
                    {defaultAddress.city}
                    {defaultAddress.state && `, ${defaultAddress.state}`}
                    {defaultAddress.postal_code && ` ${defaultAddress.postal_code}`}
                  </p>
                  {defaultAddress.contact_num && (
                    <p className="text-sm text-muted-foreground">
                      Phone: {defaultAddress.contact_num}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <AddressManagement />
        </div>
      )}
    </div>
  );
}
