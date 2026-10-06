export const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const finalPrice = (price: number, discount: number) => Math.round(price * (1 - discount / 100));
