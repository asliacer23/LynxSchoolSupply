import { MapPin, Trash2, Edit2, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAddress } from '../services/address.service';

interface AddressCardProps {
  address: UserAddress;
  isDefault?: boolean;
  onEdit?: (address: UserAddress) => void;
  onDelete?: (addressId: string) => void;
  onSetDefault?: (addressId: string) => void;
}

export function AddressCard({
  address,
  isDefault = false,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <Card className="relative">
      <CardContent className="pt-6">
        {isDefault && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-blue-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Default
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          {address.label && (
            <div className="text-sm font-semibold text-muted-foreground">
              {address.label}
            </div>
          )}

          {address.recipient_name && (
            <div className="font-medium text-sm">
              {address.recipient_name}
            </div>
          )}

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p>{address.address_line1}</p>
              {address.address_line2 && <p>{address.address_line2}</p>}
              <p>
                {address.city}
                {address.state && `, ${address.state}`}
                {address.postal_code && ` ${address.postal_code}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{address.country}</p>
            </div>
          </div>

          {address.contact_num && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Phone: </span>
              {address.contact_num}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {!isDefault && onSetDefault && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onSetDefault(address.id)}
              >
                <Star className="w-4 h-4 mr-2" />
                Set Default
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(address)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700"
                onClick={() => onDelete(address.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
