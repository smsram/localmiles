import AddressForm from '@/components/address/AddressForm';

export const metadata = {
  title: 'Add New Address | Local Miles',
  description: 'Add a new pickup or drop-off address to your address book.',
};

export default function CreateAddressPage() {
  // We simply render the form without passing an ID. 
  // The component will automatically know it's in "Create Mode".
  return <AddressForm />;
}