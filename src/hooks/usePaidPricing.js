import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Available pricing items (for students)
export const usePaidPricing = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('paid_pricing')
        .select('*')
        .eq('is_available', true)
        .order('display_order', { ascending: true });
      setItems((data || []).map(mapPricing));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('paid-pricing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_pricing' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { items, loading };
};

// All pricing items (for staff admin)
export const useAllPaidPricing = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('paid_pricing')
        .select('*')
        .order('display_order', { ascending: true });
      setItems((data || []).map(mapPricing));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('all-paid-pricing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_pricing' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { items, loading };
};

function mapPricing(row) {
  return {
    id: row.id,
    itemName: row.item_name,
    category: row.category,
    pricePerPiece: row.price_per_piece,
    unit: row.unit,
    iconEmoji: row.icon_emoji,
    isAvailable: row.is_available,
    displayOrder: row.display_order,
    lastUpdatedBy: row.last_updated_by,
    lastUpdatedAt: row.last_updated_at,
    createdAt: row.created_at,
  };
}
