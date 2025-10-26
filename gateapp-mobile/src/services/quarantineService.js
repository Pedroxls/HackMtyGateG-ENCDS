/**
 * Quarantine Service - Gestión de productos rechazados
 */

import { supabase } from './supabase';

/**
 * Registra un producto en cuarentena
 */
export async function addToQuarantine({
  productId,
  productName,
  productCode,
  rejectionReason,
  rejectionDetails,
  expiryDate,
  lotNumber,
  drawerId,
  drawerNumber,
  flightId,
  rejectedBy,
  rejectedByName,
  imageUrl
}) {
  try {
    console.log('📦 Agregando producto a cuarentena:', {
      productName,
      rejectionReason
    });

    const { data, error } = await supabase
      .from('quarantine_items')
      .insert({
        product_id: productId,
        product_name: productName,
        product_code: productCode,
        rejection_reason: rejectionReason,
        rejection_details: rejectionDetails,
        expiry_date: expiryDate,
        lot_number: lotNumber,
        drawer_id: drawerId,
        drawer_number: drawerNumber,
        flight_id: flightId,
        rejected_by: rejectedBy,
        rejected_by_name: rejectedByName,
        image_url: imageUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error agregando a cuarentena:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Producto agregado a cuarentena:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en addToQuarantine:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene todos los productos en cuarentena
 */
export async function getQuarantineItems({
  status = null,
  limit = 50,
  offset = 0
} = {}) {
  try {
    let query = supabase
      .from('quarantine_items')
      .select(`
        *,
        drawers_assembled!drawer_id (
          drawer_number
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo cuarentena:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en getQuarantineItems:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene estadísticas de cuarentena
 */
export async function getQuarantineStats() {
  try {
    const { data, error } = await supabase
      .from('quarantine_items')
      .select('status, rejection_reason');

    if (error) {
      console.error('❌ Error obteniendo stats:', error);
      return { success: false, error: error.message };
    }

    // Calcular estadísticas
    const stats = {
      total: data.length,
      pending: data.filter(i => i.status === 'pending').length,
      approved: data.filter(i => i.status === 'approved').length,
      disposed: data.filter(i => i.status === 'disposed').length,
      returned: data.filter(i => i.status === 'returned').length,
      by_reason: {
        expired: data.filter(i => i.rejection_reason === 'expired').length,
        damaged: data.filter(i => i.rejection_reason === 'damaged').length,
        missing_label: data.filter(i => i.rejection_reason === 'missing_label').length,
        other: data.filter(i => i.rejection_reason === 'other').length
      }
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('❌ Error en getQuarantineStats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza el estado de un item en cuarentena
 */
export async function updateQuarantineStatus(itemId, status, resolutionNotes = null, resolvedBy = null) {
  try {
    const updateData = {
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy
    };

    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }

    const { data, error } = await supabase
      .from('quarantine_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando status:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Status actualizado:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en updateQuarantineStatus:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene items de cuarentena por drawer
 */
export async function getQuarantineByDrawer(drawerId) {
  try {
    const { data, error } = await supabase
      .from('quarantine_items')
      .select('*')
      .eq('drawer_id', drawerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo cuarentena por drawer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en getQuarantineByDrawer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene items de cuarentena del usuario actual
 */
export async function getMyQuarantineItems(userId) {
  try {
    const { data, error } = await supabase
      .from('quarantine_items')
      .select('*')
      .eq('rejected_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo mis items:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en getMyQuarantineItems:', error);
    return { success: false, error: error.message };
  }
}
