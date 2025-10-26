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
    console.log('🔍 [getActiveDrawers] Iniciando query de drawers...');
    console.log('🔍 [getActiveDrawers] Query params:', { verified: false });

    // Primero obtener los drawers
    const { data: drawersData, error: drawersError } = await supabase
      .from('drawers_assembled')
      .select('*')
      .eq('verified', false) // Solo drawers no verificados (pendientes/en progreso)
      .order('completed_at', { ascending: false });

    console.log('📦 [getActiveDrawers] Raw response:', {
      dataType: typeof drawersData,
      isArray: Array.isArray(drawersData),
      length: drawersData?.length,
      data: drawersData,
      error: drawersError,
    });

    if (drawersError) {
      console.error('❌ [getActiveDrawers] Error obteniendo drawers:', drawersError);
      throw drawersError;
    }

    if (!drawersData || drawersData.length === 0) {
      console.warn('⚠️ [getActiveDrawers] No se encontraron drawers');
      console.warn('⚠️ Intentando obtener TODOS los drawers para debug...');

      // Debug: obtener todos los drawers sin filtro
      const { data: allDrawers } = await supabase
        .from('drawers_assembled')
        .select('id, verified');

      console.log('🔍 Todos los drawers en DB:', allDrawers);

      return { data: [], error: null };
    }

    // Para cada drawer, obtener flight, content y scanned products manualmente
    console.log('🔄 [getActiveDrawers] Obteniendo relaciones para cada drawer...');
    const drawersWithRelations = await Promise.all(
      drawersData.map(async (drawer, index) => {
        console.log(`  📋 Drawer ${index + 1}/${drawersData.length}: ${drawer.id}`);

        // Obtener flight
        let flights = null;
        if (drawer.flight_id) {
          console.log(`    ✈️  Obteniendo flight: ${drawer.flight_id}`);
          const { data: flightData, error: flightError } = await supabase
            .from('flights')
            .select('flight_number, route, arrival_time, flight_type')
            .eq('id', drawer.flight_id)
            .single();

          if (flightError) {
            console.error(`    ❌ Error obteniendo flight:`, flightError);
          } else {
            console.log(`    ✅ Flight: ${flightData?.flight_number}`);
          }
          flights = flightData;
        }

        // Obtener drawer_content con productos
        console.log(`    📦 Obteniendo drawer_content...`);
        const { data: contentData, error: contentError } = await supabase
          .from('drawer_content')
          .select('quantity, product_id')
          .eq('drawer_id', drawer.id);

        if (contentError) {
          console.error(`    ❌ Error obteniendo drawer_content:`, contentError);
        } else {
          console.log(`    ✅ Content items: ${contentData?.length || 0}`);
        }

        // Para cada content, obtener el producto
        let drawer_content = [];
        if (contentData && contentData.length > 0) {
          console.log(`    🔍 Obteniendo productos...`);
          drawer_content = await Promise.all(
            contentData.map(async (content) => {
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, name, category, sku')
                .eq('id', content.product_id)
                .single();

              if (productError) {
                console.error(`    ❌ Error obteniendo producto:`, productError);
              }

              return {
                quantity: content.quantity,
                products: productData,
              };
            })
          );
          console.log(`    ✅ Productos obtenidos: ${drawer_content.length}`);
        }

        // Obtener scanned_products
        console.log(`    🔎 Obteniendo scanned_products...`);
        const { data: scannedData, error: scannedError } = await supabase
          .from('scanned_products')
          .select('*')
          .eq('drawer_id', drawer.id);

        if (scannedError) {
          console.error(`    ❌ Error obteniendo scanned_products:`, scannedError);
        } else {
          console.log(`    ✅ Scanned products: ${scannedData?.length || 0}`);
        }

        const result = {
          ...drawer,
          flights,
          drawer_content,
          scanned_products: scannedData || [],
        };

        console.log(`  ✅ Drawer ${index + 1} completado`);
        return result;
      })
    );

    console.log('✅ [getActiveDrawers] Todos los drawers procesados:', drawersWithRelations.length);
    return { data: drawersWithRelations, error: null };
  } catch (error) {
    console.error('❌ [getActiveDrawers] Error fatal:', error);
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

// Iniciar/reanudar ensamblaje de drawer
export async function startDrawerAssembly(drawerId) {
  try {
    const { data, error } = await supabase
      .from('drawers_assembled')
      .update({
        assembly_started_at: new Date().toISOString(),
        assembly_paused_at: null,
      })
      .eq('id', drawerId)
      .select();

    if (error) throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Error starting drawer assembly:', error);
    return { data: null, error };
  }
}

// Pausar ensamblaje de drawer (guardar tiempo transcurrido)
export async function pauseDrawerAssembly(drawerId, elapsedSeconds) {
  try {
    console.log('⏸️ Pausando drawer:', drawerId, 'Tiempo:', elapsedSeconds);

    const { data, error } = await supabase
      .from('drawers_assembled')
      .update({
        assembly_paused_at: new Date().toISOString(),
        total_assembly_time_sec: elapsedSeconds,
      })
      .eq('id', drawerId)
      .select();

    if (error) throw error;

    console.log('✅ Drawer pausado exitosamente:', data);
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('❌ Error pausing drawer assembly:', error);
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
