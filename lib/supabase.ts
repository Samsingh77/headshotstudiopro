import { createClient } from '@supabase/supabase-js';

/**
 * AI Suite Central Project Credentials
 * These credentials link this app to the shared ecosystem database
 * ensuring users keep their balance across all AI Suite tools.
 */
const getEnvVar = (name: string, fallback: string = ''): string => {
  const val = import.meta.env[name] || (typeof process !== 'undefined' ? process.env[name] : '') || fallback;
  if (val === 'undefined' || val === 'null' || !val) return fallback;
  return val.trim();
};

const supabaseUrlRaw = getEnvVar('VITE_SUPABASE_URL', 'https://auqwezpczravciclsemz.supabase.co');
let supabaseUrl = supabaseUrlRaw;
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', ''); 

const createDummyClient = () => ({
  from: () => ({ 
    select: () => ({ 
      eq: () => ({ 
        maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        single: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: new Error('Supabase not initialized') }) })
      }),
      order: () => Promise.resolve({ data: [], error: new Error('Supabase not initialized') })
    }),
    insert: () => ({ 
      select: () => ({ 
        single: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }) 
      }) 
    }),
    update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not initialized') }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not initialized') }) })
  }),
  auth: { 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve(),
    signInWithOAuth: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
    signUp: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
    signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not initialized') })
  },
  storage: { 
    from: () => ({ 
      upload: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }), 
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => Promise.resolve({ error: new Error('Supabase not initialized') })
    }) 
  },
  channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  removeChannel: () => {}
} as any);

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'undefined' && supabaseAnonKey !== '') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();

/**
 * Shared AI Wallet: Profiles Fetching & Registration
 * Used across the entire ecosystem for core balance tracking
 */
export const getUserProfile = async (userId: string, email?: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    
    // If no profile exists and we have an email, create one (Self-registration)
    if (!data && email) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          tokens: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return newProfile;
    }
    
    return data;
  } catch (err) {
    console.error("Shared Wallet: getUserProfile failed", err);
    return null;
  }
};

/**
 * Shared AI Wallet: Payment Verification & Credit Injection
 * Centralized payments table used by all tools in the suite
 */
export const addPaymentRecord = async (userId: string, amount: number, tokens: number, method: string, status: string = 'completed') => {
  try {
    // 1. Log the payment event
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      amount: amount,
      tokens_added: tokens,
      payment_method: method,
      status: status,
      app_name: 'HeadshotStudioPro',
      created_at: new Date().toISOString()
    });
    
    if (paymentError) throw paymentError;
    
    // 2. Update the user's shared balance
    const profile = await getUserProfile(userId);
    if (profile) {
      const newBalance = (profile.tokens || 0) + tokens;
      
      // Calculate previews to add based on package size (Syncing with GraphToSheets tiers)
      let previewsToAdd = 0;
      if (tokens === 10) previewsToAdd = 4;
      else if (tokens === 50) previewsToAdd = 20;
      else if (tokens === 125) previewsToAdd = 50;

      const newPreviews = (profile.previews_remaining || 0) + previewsToAdd;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          tokens: newBalance,
          previews_remaining: newPreviews,
          last_active_app: 'HeadshotStudioPro',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      return true;
    }
    return false;
  } catch (err) {
    console.error("Shared Wallet: addPaymentRecord failed", err);
    return false;
  }
};

export const uploadToSupabaseStorage = async (base64Data: string, userId: string, isHighRes: boolean, isThumbnail: boolean = false): Promise<string> => {
  try {
    // Extract base64 content
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Convert base64 to Blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/webp' });

    const type = isThumbnail ? 'thumb' : (isHighRes ? 'hd' : 'proof');
    const fileName = `${userId}/${Date.now()}_${type}.webp`;
    
    const { data, error } = await supabase.storage
      .from('ai_portraits')
      .upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: false
      });

    if (error) {
      console.warn("Storage upload error:", error);
      // We MUST NOT return base64 here anymore to save DB space
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('ai_portraits')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Failed to upload to storage:", err);
    throw err;
  }
};

export const deleteFromSupabaseStorage = async (imageUrl: string) => {
  try {
    if (!imageUrl || !imageUrl.includes('/storage/v1/object/public/ai_portraits/')) return;
    
    // Extract the file path from the URL
    const pathParts = imageUrl.split('/storage/v1/object/public/ai_portraits/');
    if (pathParts.length > 1) {
      const filePath = pathParts[1];
      const { error } = await supabase.storage.from('ai_portraits').remove([filePath]);
      if (error && !String(error.message).includes('Failed to fetch')) {
        console.warn("Storage delete error:", error);
      }
    }
  } catch (err) {
    console.warn("Failed to delete from storage:", err);
  }
};

/**
 * Cleanup logic: Deletes generations based on retention policy
 * Previews: 5 days
 * HD Portraits: 15 days
 */
export const cleanupOldGenerations = async (userId: string) => {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // 1. Cleanup Previews (5 days)
    const { data: oldPreviews, error: previewError } = await supabase
      .from('generations')
      .select('id, image_data, thumbnail_url')
      .eq('user_id', userId)
      .eq('is_unlocked', false)
      .lt('created_at', fiveDaysAgo.toISOString());

    if (previewError) throw previewError;

    // 2. Cleanup HD Portraits (15 days)
    const { data: oldHD, error: hdError } = await supabase
      .from('generations')
      .select('id, image_data, thumbnail_url')
      .eq('user_id', userId)
      .eq('is_unlocked', true)
      .lt('created_at', fifteenDaysAgo.toISOString());

    if (hdError) throw hdError;

    const allOldGens = [...(oldPreviews || []), ...(oldHD || [])];
    if (allOldGens.length === 0) return;

    console.log(`Cleaning up ${allOldGens.length} old generations...`);

    for (const gen of allOldGens) {
      // Delete main image
      if (gen.image_data) await deleteFromSupabaseStorage(gen.image_data);
      // Delete thumbnail
      if (gen.thumbnail_url) await deleteFromSupabaseStorage(gen.thumbnail_url);
      
      // Delete from DB
      await supabase.from('generations').delete().eq('id', gen.id);
    }
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
};

/**
 * Universal Logging: Logs activity to app_activity table
 */
export const logActivity = async (userId: string, costTokens: number, imageUrl: string) => {
  try {
    const { error } = await supabase.from('app_activity').insert({
      user_id: userId,
      app_name: 'HeadshotStudioPro',
      cost_tokens: costTokens,
      metadata: { image_url: imageUrl }
    });
    if (error) console.error("Activity logging failed:", error);
  } catch (err) {
    console.error("Activity logging error:", err);
  }
};
