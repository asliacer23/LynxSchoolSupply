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
    <Card className="relative transition hover:shadow-md">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            {address.label && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {address.label}
              </p>
            )}
            {address.recipient_name && (
              <p className="font-medium text-sm sm:text-base">
                {address.recipient_name}
              </p>
            )}
          </div>

          {isDefault && (
            <Badge className="bg-blue-500 text-white flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">Default</span>
            </Badge>
          )}
        </div>

        {/* Address */}
        <div className="flex gap-2 text-sm">
          <MapPin className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
          <div className="space-y-0.5">
            <p>{address.address_line1}</p>
            {address.address_line2 && <p>{address.address_line2}</p>}
            <p>
              {address.city}
              {address.state && `, ${address.state}`}
              {address.postal_code && ` ${address.postal_code}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {address.country}
            </p>
          </div>
        </div>

        {/* Phone */}
        {address.contact_num && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Phone:</span> {address.contact_num}
          </p>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          {!isDefault && onSetDefault && (
            <Button
              variant="outline"
              size="sm"
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
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(address.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
