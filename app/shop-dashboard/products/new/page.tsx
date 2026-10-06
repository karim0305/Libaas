'use client';
import ProductForm from '@/components/ProductForm';
import { useMyShop } from '@/components/useMyShop';
export default function NewProduct() { const { shopId } = useMyShop(); return <ProductForm shopId={shopId} />; }
