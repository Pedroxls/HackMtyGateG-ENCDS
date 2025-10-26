import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { supabase } from '../../src/services/supabase';
import { parseISODateLocal, formatExpiryDate } from '../../src/utils/dateValidation';
import LoadingScreen from '../../src/components/common/LoadingScreen';
import FadeInView from '../../src/components/common/FadeInView';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'expired', 'expiring'

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, activeFilter]);

  const loadAlerts = async () => {
    try {
      console.log('📢 [Alerts] Cargando alertas...');

      // Get all scanned products with expiry dates
      const { data: scannedData, error: scannedError } = await supabase
        .from('scanned_products')
        .select('*')
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true });

      if (scannedError) throw scannedError;

      if (!scannedData || scannedData.length === 0) {
        console.log('⚠️ No se encontraron productos escaneados con fechas de caducidad');
        setAlerts([]);
        setLoading(false);
        return;
      }

      console.log(`✅ Productos con caducidad: ${scannedData.length}`);

      // For each scanned product, get product, drawer, and flight info
      const enrichedAlerts = await Promise.all(
        scannedData.map(async (scanned) => {
          // Get product info
          let product = null;
          if (scanned.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('id, name, category, sku')
              .eq('id', scanned.product_id)
              .single();
            product = productData;
          }

          // Get drawer info
          let drawer = null;
          let flight = null;
          if (scanned.drawer_id) {
            const { data: drawerData } = await supabase
              .from('drawers_assembled')
              .select('id, drawer_number, flight_id')
              .eq('id', scanned.drawer_id)
              .single();

            drawer = drawerData;

            // Get flight info
            if (drawerData?.flight_id) {
              const { data: flightData } = await supabase
                .from('flights')
                .select('flight_number, route, flight_type')
                .eq('id', drawerData.flight_id)
                .single();
              flight = flightData;
            }
          }

          // Parse expiry date
          const expiryDate = parseISODateLocal(scanned.expiry_date);
          const validation = validateExpiryDate(expiryDate);

          return {
            id: scanned.id,
            product,
            drawer,
            flight,
            expiryDate,
            expiryDateFormatted: formatExpiryDate(expiryDate),
            lotNumber: scanned.lot_number,
            scannedAt: scanned.scanned_at,
            status: validation.status,
            statusMessage: validation.message,
            statusColor: validation.color,
            daysRemaining: validation.daysRemaining,
          };
        })
      );

      console.log('✅ Alertas enriquecidas:', enrichedAlerts.length);
      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('❌ Error cargando alertas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validateExpiryDate = (expiryDate) => {
    if (!expiryDate || !(expiryDate instanceof Date)) {
      return { status: 'invalid', message: 'Fecha inválida', color: 'error', daysRemaining: 0 };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        message: `Caducado hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`,
        daysRemaining: diffDays,
        color: 'error',
      };
    }

    if (diffDays <= 7) {
      return {
        status: 'warning',
        message: `Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}`,
        daysRemaining: diffDays,
        color: 'warning',
      };
    }

    return {
      status: 'valid',
      message: `Vence en ${diffDays} días`,
      daysRemaining: diffDays,
      color: 'success',
    };
  };

  const filterAlerts = () => {
    if (activeFilter === 'all') {
      setFilteredAlerts(alerts);
    } else if (activeFilter === 'expired') {
      setFilteredAlerts(alerts.filter((a) => a.status === 'expired'));
    } else if (activeFilter === 'expiring') {
      setFilteredAlerts(alerts.filter((a) => a.status === 'warning'));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'checkmark-circle';
    }
  };

  const getStatusColor = (color) => {
    switch (color) {
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.success;
    }
  };

  const renderAlert = ({ item }) => {
    const statusColor = getStatusColor(item.statusColor);
    const statusIcon = getStatusIcon(item.status);

    return (
      <View style={[styles.alertCard, { borderLeftColor: statusColor }]}>
        {/* Header */}
        <View style={styles.alertHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.product?.name || 'Producto desconocido'}</Text>
            <Text style={styles.productCategory}>{item.product?.category || 'N/A'}</Text>
          </View>
          <Ionicons name={statusIcon} size={24} color={statusColor} />
        </View>

        {/* Expiry Info */}
        <View style={styles.expirySection}>
          <View style={[styles.expiryBadge, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name="calendar-outline" size={16} color={statusColor} />
            <Text style={[styles.expiryDate, { color: statusColor }]}>
              {item.expiryDateFormatted}
            </Text>
          </View>
          <Text style={[styles.statusMessage, { color: statusColor }]}>{item.statusMessage}</Text>
        </View>

        {/* LOT Number */}
        {item.lotNumber && (
          <View style={styles.lotSection}>
            <Ionicons name="barcode-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.lotText}>LOT: {item.lotNumber}</Text>
          </View>
        )}

        {/* Drawer & Flight Info */}
        <View style={styles.detailsSection}>
          {item.drawer && (
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                Drawer {item.drawer.drawer_number ? `D-${String(item.drawer.drawer_number).padStart(3, '0')}` : 'N/A'}
              </Text>
            </View>
          )}
          {item.flight && (
            <View style={styles.detailRow}>
              <Ionicons name="airplane-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                {item.flight.flight_number} • {item.flight.flight_type}
              </Text>
            </View>
          )}
        </View>

        {/* Scan timestamp */}
        <Text style={styles.timestamp}>
          Escaneado: {new Date(item.scannedAt).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    let message = 'No hay alertas';
    let icon = 'notifications-off-outline';

    if (activeFilter === 'expired') {
      message = 'No hay productos caducados';
      icon = 'checkmark-circle-outline';
    } else if (activeFilter === 'expiring') {
      message = 'No hay productos próximos a vencer';
      icon = 'checkmark-circle-outline';
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name={icon} size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  const getFilterCount = (filter) => {
    if (filter === 'all') return alerts.length;
    if (filter === 'expired') return alerts.filter((a) => a.status === 'expired').length;
    if (filter === 'expiring') return alerts.filter((a) => a.status === 'warning').length;
    return 0;
  };

  if (loading) {
    return <LoadingScreen message="Cargando alertas..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <FadeInView duration={300}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alertas</Text>
          <Text style={styles.headerSubtitle}>Productos escaneados con fecha de caducidad</Text>
        </View>
      </FadeInView>

      {/* Filter Tabs */}
      <FadeInView delay={100}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              Todos ({getFilterCount('all')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'expired' && styles.filterTabActive]}
            onPress={() => setActiveFilter('expired')}
          >
            <Text style={[styles.filterText, activeFilter === 'expired' && styles.filterTextActive]}>
              Caducados ({getFilterCount('expired')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'expiring' && styles.filterTabActive]}
            onPress={() => setActiveFilter('expiring')}
          >
            <Text style={[styles.filterText, activeFilter === 'expiring' && styles.filterTextActive]}>
              Próximos ({getFilterCount('expiring')})
            </Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={({ item, index }) => (
          <FadeInView delay={200 + index * 50}>
            {renderAlert({ item })}
          </FadeInView>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <FadeInView delay={200}>
            {renderEmptyState()}
          </FadeInView>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.background,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textInverse,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  alertCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  expirySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusMessage: {
    fontSize: 13,
    fontWeight: '500',
  },
  lotSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lotText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  detailsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});
