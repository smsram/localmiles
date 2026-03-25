import AddressForm from '@/components/address/AddressForm';

export const metadata = {
  title: 'Edit Address | Local Miles',
  description: 'Update your saved address details.',
};

export default async function EditAddressPage({ params }) {
  // In Next.js App Router, dynamic params are treated as Promises.
  // We await them here on the server before passing the ID to the client form.
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // By passing the addressId, the form automatically switches to "Edit Mode",
  // fetches the existing data, and changes the submit method to PUT.
  return <AddressForm addressId={id} />;
}