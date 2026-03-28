import AddressForm from '@/components/address/AddressForm';
export const metadata = { title: 'Edit Address | Local Miles Courier' };
export default async function CourierEditAddressPage({ params }) {
  const resolvedParams = await params;
  return <AddressForm addressId={resolvedParams.id} />;
}