'use client';
import { useState } from 'react';
import { StarInput } from './ui/Stars';
import { useToast } from './Providers';
import { submitReview } from '@/lib/services/reviews';

export default function ReviewForm({ userId, orderId, productId, productName, existing, onDone }: { userId: string; orderId: string; productId: string; productName: string; existing?: { rating: number; comment: string }; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating ?? 0); const [comment, setComment] = useState(existing?.comment ?? ''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast('Choose a star rating first.', 'error'); return; }
    setBusy(true);
    try { await submitReview(userId, { order_id: orderId, product_id: productId, rating, comment: comment.trim() }); toast('Thank you for your review!'); onDone(); }
    catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mt-2 space-y-3 rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-medium">How was “{productName}”?</p>
      <StarInput value={rating} onChange={setRating} />
      <div><label className="sr-only" htmlFor={`rv-${productId}`}>Your review</label><textarea id={`rv-${productId}`} rows={3} maxLength={600} className="input" placeholder="Fabric, fit, delivery… (optional)" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      <div className="flex gap-2"><button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : existing ? 'Update review' : 'Submit review'}</button><button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>Cancel</button></div>
    </form>
  );
}
