/**
 * 遷移腳本：將現有資料寫入 tour_itinerary_items 核心表
 * 
 * 資料來源：
 * 1. itineraries.daily_itinerary JSON → 行程欄位 (activities, meals, accommodation)
 * 2. quotes.categories JSON → 報價欄位
 * 3. tour_requests → 需求欄位
 * 4. tour_confirmation_items → 確認 + 領隊回填欄位
 * 
 * Usage: npx tsx scripts/migrate-core-table.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

interface TourItineraryItem {
  tour_id?: string;
  itinerary_id?: string;
  workspace_id: string;
  day_number?: number;
  sort_order?: number;
  category?: string;
  sub_category?: string;
  title?: string;
  description?: string;
  service_date?: string;
  service_date_end?: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  unit_price?: number;
  quantity?: number;
  total_cost?: number;
  currency?: string;
  pricing_type?: string;
  adult_price?: number;
  child_price?: number;
  infant_price?: number;
  quote_note?: string;
  quote_item_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  request_id?: string;
  request_status?: string;
  request_sent_at?: string;
  request_reply_at?: string;
  reply_content?: any;
  reply_cost?: number;
  estimated_cost?: number;
  quoted_cost?: number;
  confirmation_item_id?: string;
  confirmed_cost?: number;
  booking_reference?: string;
  booking_status?: string;
  confirmation_date?: string;
  confirmation_note?: string;
  actual_expense?: number;
  expense_note?: string;
  expense_at?: string;
  receipt_images?: string[];
  quote_status?: string;
  confirmation_status?: string;
  leader_status?: string;
}

async function migrateFromItineraries(): Promise<TourItineraryItem[]> {
  console.log('\n📋 Phase 1: Migrating from itineraries.daily_itinerary...');
  
  const { data: itineraries, error } = await supabase
    .from('itineraries')
    .select('id, tour_id, workspace_id, daily_itinerary, departure_date')
    .not('daily_itinerary', 'is', null);

  if (error) { console.error('Error fetching itineraries:', error); return []; }
  
  const items: TourItineraryItem[] = [];
  
  for (const itin of itineraries || []) {
    const days = itin.daily_itinerary;
    if (!Array.isArray(days)) continue;
    
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const dayNum = dayIdx + 1;
      const serviceDate = day.date?.replace(/\//g, '-') || null;
      let sortOrder = 0;

      // Activities
      if (Array.isArray(day.activities)) {
        for (const act of day.activities) {
          items.push({
            itinerary_id: itin.id,
            tour_id: itin.tour_id || undefined,
            workspace_id: itin.workspace_id,
            day_number: dayNum,
            sort_order: sortOrder++,
            category: 'activities',
            title: act.title || act.name,
            description: act.description,
            service_date: serviceDate,
            resource_type: act.attraction_id ? 'attraction' : undefined,
            resource_id: act.attraction_id || undefined,
          });
        }
      }

      // Meals (breakfast, lunch, dinner)
      if (day.meals && typeof day.meals === 'object') {
        for (const [mealType, mealValue] of Object.entries(day.meals)) {
          if (mealValue && typeof mealValue === 'string' && mealValue.trim()) {
            items.push({
              itinerary_id: itin.id,
              tour_id: itin.tour_id || undefined,
              workspace_id: itin.workspace_id,
              day_number: dayNum,
              sort_order: sortOrder++,
              category: 'meals',
              sub_category: mealType, // breakfast, lunch, dinner
              title: mealValue as string,
              service_date: serviceDate,
            });
          }
        }
      }

      // Accommodation
      if (day.accommodation) {
        items.push({
          itinerary_id: itin.id,
          tour_id: itin.tour_id || undefined,
          workspace_id: itin.workspace_id,
          day_number: dayNum,
          sort_order: sortOrder++,
          category: 'accommodation',
          title: day.accommodation,
          service_date: serviceDate,
          resource_type: 'hotel',
        });
      }
    }
  }
  
  console.log(`  Found ${items.length} items from ${itineraries?.length || 0} itineraries`);
  return items;
}

async function migrateFromQuotes(): Promise<TourItineraryItem[]> {
  console.log('\n💰 Phase 2: Migrating from quotes.categories...');
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('id, tour_id, workspace_id, categories')
    .not('categories', 'is', null);

  if (error) { console.error('Error fetching quotes:', error); return []; }
  
  const items: TourItineraryItem[] = [];
  
  for (const quote of quotes || []) {
    const categories = quote.categories;
    if (!Array.isArray(categories)) continue;
    
    for (const cat of categories) {
      if (!Array.isArray(cat.items)) continue;
      
      for (const item of cat.items) {
        items.push({
          tour_id: quote.tour_id || undefined,
          workspace_id: quote.workspace_id,
          category: cat.id, // transport, accommodation, meals, etc.
          title: item.name,
          quote_note: item.note,
          unit_price: item.unit_price || undefined,
          quantity: item.quantity || undefined,
          total_cost: item.total || undefined,
          pricing_type: item.pricing_type || (item.adult_price ? 'by_identity' : undefined),
          adult_price: item.adult_price || undefined,
          child_price: item.child_price || undefined,
          infant_price: item.infant_price || undefined,
          quote_item_id: item.id,
          quote_status: 'drafted',
        });
      }
    }
  }
  
  console.log(`  Found ${items.length} items from ${quotes?.length || 0} quotes`);
  return items;
}

async function migrateFromRequests(): Promise<TourItineraryItem[]> {
  console.log('\n📨 Phase 3: Migrating from tour_requests...');
  
  const { data: requests, error } = await supabase
    .from('tour_requests')
    .select('*');

  if (error) { console.error('Error fetching tour_requests:', error); return []; }
  
  const items: TourItineraryItem[] = [];
  
  for (const req of requests || []) {
    items.push({
      tour_id: req.tour_id || undefined,
      workspace_id: req.workspace_id,
      category: req.category,
      title: req.title,
      description: req.description,
      service_date: req.service_date,
      service_date_end: req.service_date_end,
      quantity: req.quantity,
      supplier_id: req.supplier_id,
      supplier_name: req.supplier_name,
      request_id: req.id,
      request_status: req.status || 'none',
      request_sent_at: req.created_at,
      request_reply_at: req.replied_at,
      reply_content: req.reply_content,
      estimated_cost: req.estimated_cost ? Number(req.estimated_cost) : undefined,
      quoted_cost: req.quoted_cost ? Number(req.quoted_cost) : undefined,
      resource_type: req.resource_type,
      resource_id: req.resource_id,
      latitude: req.latitude ? Number(req.latitude) : undefined,
      longitude: req.longitude ? Number(req.longitude) : undefined,
      google_maps_url: req.google_maps_url,
      currency: req.currency,
    });
  }
  
  console.log(`  Found ${items.length} items from tour_requests`);
  return items;
}

async function migrateFromConfirmations(): Promise<TourItineraryItem[]> {
  console.log('\n✅ Phase 4: Migrating from tour_confirmation_items...');
  
  const { data: confirmItems, error } = await supabase
    .from('tour_confirmation_items')
    .select('*, tour_confirmation_sheets!inner(tour_id)');

  if (error) { console.error('Error fetching confirmation items:', error); return []; }
  
  const items: TourItineraryItem[] = [];
  
  for (const ci of confirmItems || []) {
    items.push({
      tour_id: (ci as any).tour_confirmation_sheets?.tour_id,
      workspace_id: ci.workspace_id,
      category: ci.category,
      title: ci.title,
      description: ci.description,
      service_date: ci.service_date,
      service_date_end: ci.service_date_end,
      supplier_id: ci.supplier_id,
      supplier_name: ci.supplier_name,
      unit_price: ci.unit_price ? Number(ci.unit_price) : undefined,
      quantity: ci.quantity,
      total_cost: ci.subtotal ? Number(ci.subtotal) : undefined,
      currency: ci.currency,
      confirmation_item_id: ci.id,
      confirmed_cost: ci.actual_cost ? Number(ci.actual_cost) : undefined,
      booking_reference: ci.booking_reference,
      booking_status: ci.booking_status || 'pending',
      confirmation_note: ci.notes,
      confirmation_status: ci.booking_status === 'confirmed' ? 'confirmed' : 'pending',
      resource_type: ci.resource_type,
      resource_id: ci.resource_id,
      latitude: ci.latitude ? Number(ci.latitude) : undefined,
      longitude: ci.longitude ? Number(ci.longitude) : undefined,
      google_maps_url: ci.google_maps_url,
      // Leader fields
      actual_expense: ci.leader_expense ? Number(ci.leader_expense) : undefined,
      expense_note: ci.leader_expense_note,
      expense_at: ci.leader_expense_at,
      receipt_images: ci.receipt_images,
      leader_status: ci.leader_expense ? 'filled' : 'none',
      request_id: ci.request_id,
    });
  }
  
  console.log(`  Found ${items.length} items from tour_confirmation_items`);
  return items;
}

// Validate date string
function isValidDate(s: string | undefined | null): boolean {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Clean undefined values and sanitize dates
function cleanItem(item: TourItineraryItem): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    if (v === undefined || v === null || v === '') continue;
    // Validate date fields
    if ((k === 'service_date' || k === 'service_date_end') && !isValidDate(v as string)) {
      continue; // skip invalid dates
    }
    cleaned[k] = v;
  }
  return cleaned;
}

async function main() {
  console.log('🚀 Core Table Migration: tour_itinerary_items');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '⚡ LIVE'}`);

  // Get valid tour_ids for FK validation
  const { data: validTours } = await supabase.from('tours').select('id');
  const validTourIds = new Set((validTours || []).map(t => t.id));
  
  // Run all 4 phases
  const [itinItems, quoteItems, requestItems, confirmItems] = await Promise.all([
    migrateFromItineraries(),
    migrateFromQuotes(),
    migrateFromRequests(),
    migrateFromConfirmations(),
  ]);

  const allItems = [
    ...itinItems.map(i => ({ ...i, _source: 'itinerary' })),
    ...quoteItems.map(i => ({ ...i, _source: 'quote' })),
    ...requestItems.map(i => ({ ...i, _source: 'request' })),
    ...confirmItems.map(i => ({ ...i, _source: 'confirmation' })),
  ];

  console.log(`\n📊 Summary:`);
  console.log(`  Itinerary items: ${itinItems.length}`);
  console.log(`  Quote items:     ${quoteItems.length}`);
  console.log(`  Request items:   ${requestItems.length}`);
  console.log(`  Confirm items:   ${confirmItems.length}`);
  console.log(`  Total:           ${allItems.length}`);

  if (DRY_RUN) {
    console.log('\n🔍 Dry run complete. Sample items:');
    for (const source of ['itinerary', 'quote', 'request', 'confirmation']) {
      const sample = allItems.find(i => (i as any)._source === source);
      if (sample) {
        const { _source, ...rest } = sample as any;
        console.log(`\n  [${source}]`, JSON.stringify(cleanItem(rest), null, 2).slice(0, 300));
      }
    }
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;
  
  for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
    const batch = allItems.slice(i, i + BATCH_SIZE).map(({ _source, ...item }: any) => {
      const cleaned = cleanItem(item);
      // Validate FK: tour_id must exist
      if (cleaned.tour_id && !validTourIds.has(cleaned.tour_id)) {
        delete cleaned.tour_id;
      }
      return cleaned;
    });
    
    const { error } = await supabase
      .from('tour_itinerary_items')
      .insert(batch);

    if (error) {
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      console.error('  Sample item:', JSON.stringify(batch[0]).slice(0, 200));
    } else {
      inserted += batch.length;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)`);
    }
  }

  console.log(`\n✅ Migration complete: ${inserted}/${allItems.length} items inserted`);
  
  // Verify
  const { count } = await supabase
    .from('tour_itinerary_items')
    .select('*', { count: 'exact', head: true });
  console.log(`📊 Total rows in tour_itinerary_items: ${count}`);
}

main().catch(console.error);
