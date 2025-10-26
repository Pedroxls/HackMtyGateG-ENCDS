/**
 * Servicio de Supabase para la app móvil
 * Maneja todas las operaciones con la base de datos
 */

import { supabase } from './supabase';

/**
 * DRAWERS
 */

// Obtener todos los drawers pendientes y en progreso
export async function getActiveDrawers() {
  try {
    // Primero obtener los drawers
    const { data: drawersData, error: drawersError } = await supabase
      .from('drawers_assembled')
      .select('*')
      .eq('verified', false) // Solo drawers no verificados (pendientes/en progreso)
      .order('completed_at', { ascending: false });

    if (drawersError) throw drawersError;
    if (!drawersData) return { data: [], error: null };

    // Para cada drawer, obtener flight, content y scanned products manualmente
    const drawersWithRelations = await Promise.all(
      drawersData.map(async (drawer) => {
        // Obtener flight
        let flights = null;
        if (drawer.flight_id) {
          const { data: flightData } = await supabase
            .from('flights')
            .select('flight_number, route, arrival_time, flight_type')
            .eq('id', drawer.flight_id)
            .single();
          flights = flightData;
        }

        // Obtener drawer_content con productos
        const { data: contentData } = await supabase
          .from('drawer_content')
          .select('quantity, product_id')
          .eq('drawer_id', drawer.id);

        // Para cada content, obtener el producto
        let drawer_content = [];
        if (contentData) {
          drawer_content = await Promise.all(
            contentData.map(async (content) => {
              const { data: productData } = await supabase
                .from('products')
                .select('id, name, category, sku')
                .eq('id', content.product_id)
                .single();

              return {
                quantity: content.quantity,
                products: productData,
              };
            })
          );
        }

        // Obtener scanned_products
        const { data: scannedData } = await supabase
          .from('scanned_products')
          .select('*')
          .eq('drawer_id', drawer.id);

        return {
          ...drawer,
          flights,
          drawer_content,
          scanned_products: scannedData || [],
        };
      })
    );

    return { data: drawersWithRelations, error: null };
  } catch (error) {
    console.error('Error fetching drawers:', error);
    return { data: null, error };
  }
}

// Obtener un drawer específico con todos sus productos
export async function getDrawerById(drawerId) {
  try {
    // Obtener drawer
    const { data: drawer, error: drawerError } = await supabase
      .from('drawers_assembled')
      .select('*')
      .eq('id', drawerId)
      .single();

    if (drawerError) throw drawerError;
    if (!drawer) return { data: null, error: null };

    // Obtener flight
    let flights = null;
    if (drawer.flight_id) {
      const { data: flightData } = await supabase
        .from('flights')
        .select('flight_number, route, arrival_time, flight_type')
        .eq('id', drawer.flight_id)
        .single();
      flights = flightData;
    }

    // Obtener drawer_content
    const { data: contentData } = await supabase
      .from('drawer_content')
      .select('id, quantity, product_id')
      .eq('drawer_id', drawerId);

    // Para cada content, obtener el producto
    let drawer_content = [];
    if (contentData) {
      drawer_content = await Promise.all(
        contentData.map(async (content) => {
          const { data: productData } = await supabase
            .from('products')
            .select('id, name, category, sku, expiration_days')
            .eq('id', content.product_id)
            .single();

          return {
            id: content.id,
            quantity: content.quantity,
            products: productData,
          };
        })
      );
    }

    // Obtener scanned_products
    const { data: scannedData } = await supabase
      .from('scanned_products')
      .select('id, product_id, expiry_date, lot_number, scanned_at, confidence, status')
      .eq('drawer_id', drawerId);

    const result = {
      ...drawer,
      flights,
      drawer_content,
      scanned_products: scannedData || [],
    };

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching drawer:', error);
    return { data: null, error };
  }
}

// Actualizar drawer como completado
export async function completeDrawer(drawerId) {
  try {
    const { data, error } = await supabase
      .from('drawers_assembled')
      .update({
        verified: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', drawerId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error completing drawer:', error);
    return { data: null, error };
  }
}

/**
 * PRODUCTOS ESCANEADOS
 */

// Guardar producto escaneado con fecha de caducidad
export async function saveScannedProduct({
  drawerId,
  productId,
  expiryDate,
  lotNumber,
  confidence,
  status,
  scannedBy = null, // UUID del empleado
}) {
  try {
    const { data, error } = await supabase
      .from('scanned_products')
      .insert([
        {
          drawer_id: drawerId,
          product_id: productId,
          expiry_date: expiryDate,
          lot_number: lotNumber,
          confidence,
          status,
          scanned_by: scannedBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error saving scanned product:', error);
    return { data: null, error };
  }
}

// Obtener productos escaneados de un drawer
export async function getScannedProducts(drawerId) {
  try {
    const { data, error } = await supabase
      .from('scanned_products')
      .select(`
        *,
        products (
          name,
          category,
          sku
        )
      `)
      .eq('drawer_id', drawerId)
      .order('scanned_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching scanned products:', error);
    return { data: null, error };
  }
}

/**
 * PRODUCTOS
 */

// Obtener todos los productos
export async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { data: null, error };
  }
}

/**
 * PRODUCTIVITY
 */

// Guardar log de productividad
export async function saveProductivityLog({
  employeeId,
  drawerId,
  flightId,
  buildTimeSeconds,
  trolleyType = 'standard',
}) {
  try {
    const { data, error } = await supabase
      .from('productivity_logs')
      .insert([
        {
          employee_id: employeeId,
          drawer_id: drawerId,
          flight_id: flightId,
          build_time_sec: buildTimeSeconds,
          trolley_type: trolleyType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error saving productivity log:', error);
    return { data: null, error };
  }
}
