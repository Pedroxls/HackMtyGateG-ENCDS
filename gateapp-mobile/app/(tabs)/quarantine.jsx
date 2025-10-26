/**
 * Quarantine Screen - Lista de productos rechazados
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import {
  getQuarantineItems,
  getQuarantineStats,
  updateQuarantineStatus
} from '../../src/services/quarantineService';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import FadeInView from '../../src/components/common/FadeInView';

export default function QuarantineScreen() {
  const user = useAuthStore(state => state.user);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar items
      const statusFilter = filter === 'all' ? null : filter === 'pending' ? 'pending' : null;
      const itemsResult = await getQuarantineItems({ status: statusFilter });

      if (itemsResult.success) {
        setItems(itemsResult.data || []);
      }

      // Cargar stats
      const statsResult = await getQuarantineStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading quarantine:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEditReason = (item) => {
    Alert.prompt(
      'Editar Razón de Rechazo',
      `Producto: ${item.product_name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: (newReason) => {
            if (newReason && newReason.trim()) {
              updateRejectionReason(item.id, newReason.trim());
            }
          }
        }
      ],
      'plain-text',
      item.rejection_details || item.rejection_reason
    );
  };

  const updateRejectionReason = async (itemId, newDetails) => {
    try {
      const { data, error } = await supabase
        .from('quarantine_items')
        .update({ rejection_details: newDetails })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      Alert.alert('✅ Actualizado', 'La razón de rechazo ha sido actualizada');
      loadData();
    } catch (error) {
      console.error('Error updating reason:', error);
      Alert.alert('❌ Error', 'No se pudo actualizar la razón');
    }
  };

  const handleResolve = (item) => {
    Alert.alert(
      'Resolver Item',
      `¿Qué acción tomar con ${item.product_name}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: '✅ Aprobar (devolver)',
          onPress: () => resolveItem(item.id, 'returned', 'Producto aprobado para devolución')
        },
        {
          text: '🗑️ Desechar',
          onPress: () => resolveItem(item.id, 'disposed', 'Producto desechado'),
          style: 'destructive'
        }
      ]
    );
  };

  const resolveItem = async (itemId, status, notes) => {
    try {
      const result = await updateQuarantineStatus(itemId, status, notes, user?.id);
      if (result.success) {
        Alert.alert('✅ Resuelto', 'El item ha sido actualizado');
        loadData();
      } else {
        Alert.alert('❌ Error', 'No se pudo actualizar el item');
      }
    } catch (error) {
      console.error('Error resolving item:', error);
      Alert.alert('❌ Error', 'Hubo un problema al resolver el item');
    }
  };

  const getRejectionIcon = (reason) => {
    switch (reason) {
      case 'expired': return '📅';
      case 'damaged': return '💔';
      case 'missing_label': return '🏷️';
      default: return '⚠️';
    }
  };

  const getRejectionColor = (reason) => {
    switch (reason) {
      case 'expired': return COLORS.warning;
      case 'damaged': return COLORS.error;
      case 'missing_label': return '#f59e0b';
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendiente', color: COLORS.warning, icon: 'time' },
      returned: { label: 'Devuelto', color: '#10b981', icon: 'checkmark-circle' },
      disposed: { label: 'Desechado', color: COLORS.error, icon: 'trash' },
      approved: { label: 'Aprobado', color: COLORS.success, icon: 'checkmark' }
    };
    return config[status] || config.pending;
  };

  const renderItem = ({ item, index }) => {
    const statusBadge = getStatusBadge(item.status);
    const rejectionColor = getRejectionColor(item.rejection_reason);

    return (
      <FadeInView delay={index * 50}>
        <View style={styles.itemCard}>
          {/* Header */}
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <Text style={styles.itemIcon}>
                {getRejectionIcon(item.rejection_reason)}
              </Text>
              <View style={styles.itemTitleContent}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemDrawer}>
                  Drawer: {item.drawers_assembled?.drawer_number || item.drawer_number || 'N/A'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusBadge.color}20` }]}>
              <Ionicons name={statusBadge.icon} size={14} color={statusBadge.color} />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Razón:</Text>
              <Text style={[styles.detailValue, { color: rejectionColor, flex: 1 }]}>
                {item.rejection_details}
              </Text>
              {item.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => handleEditReason(item)}
                  style={styles.editButton}
                >
                  <Ionicons name="pencil" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>

            {item.expiry_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vencimiento:</Text>
                <Text style={styles.detailValue}>{item.expiry_date}</Text>
              </View>
            )}

            {item.lot_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lote:</Text>
                <Text style={styles.detailValue}>{item.lot_number}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rechazado por:</Text>
              <Text style={styles.detailValue}>{item.rejected_by_name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>

          {/* Actions */}
          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolve(item)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.resolveButtonText}>Resolver</Text>
            </TouchableOpacity>
          )}

          {item.status !== 'pending' && item.resolution_notes && (
            <View style={styles.resolutionNotes}>
              <Text style={styles.resolutionLabel}>Resolución:</Text>
              <Text style={styles.resolutionText}>{item.resolution_notes}</Text>
            </View>
          )}
        </View>
      </FadeInView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando cuarentena...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <FadeInView duration={300}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="alert-circle" size={28} color={COLORS.error} />
            <Text style={styles.title}>Cuarentena</Text>
          </View>
          <Text style={styles.subtitle}>
            Productos rechazados para revisión
          </Text>
        </View>
      </FadeInView>

      {/* Stats */}
      {stats && (
        <FadeInView delay={100}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.statCardPending]}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {stats.pending}
              </Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={[styles.statCard, styles.statCardResolved]}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {stats.returned + stats.disposed}
              </Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>
          </View>
        </FadeInView>
      )}

      {/* Filters */}
      <FadeInView delay={150}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
            onPress={() => setFilter('resolved')}
          >
            <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
              Resueltos
            </Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      {/* List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>No hay items en cuarentena</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending'
                ? 'No hay productos pendientes de revisión'
                : 'Todos los productos están en buen estado'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardPending: {
    backgroundColor: `${COLORS.warning}10`,
    borderColor: `${COLORS.warning}30`,
  },
  statCardResolved: {
    backgroundColor: '#10b98110',
    borderColor: '#10b98130',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textInverse,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  itemIcon: {
    fontSize: 28,
  },
  itemTitleContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDrawer: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    minWidth: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  resolveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resolutionNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: `${COLORS.primary}15`,
  },
});
