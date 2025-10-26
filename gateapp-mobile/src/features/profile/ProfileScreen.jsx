import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  getEmployeeById,
  updateEmployeeById,
} from '../../services/employees';

const initialFormState = {
  name: '',
  role: '',
  base: '',
  number: '',
  shift: '',
};

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    signOut,
    resetPassword,
    updateProfile,
    updatingProfile,
  } = useAuthStore();

  const [employee, setEmployee] = useState(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [employeeError, setEmployeeError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [signingOut, setSigningOut] = useState(false);

  const loadEmployee = useCallback(async () => {
    if (!user?.id) {
      setEmployee(null);
      setLoadingEmployee(false);
      return;
    }

    setLoadingEmployee(true);
    setEmployeeError(null);

    try {
      const data = await getEmployeeById(user.id);
      setEmployee(data);
      setFormState({
        name: data?.name ?? '',
        role: data?.role ?? '',
        base: data?.base ?? '',
        number: data?.number != null ? String(data.number) : '',
        shift: data?.shift ?? '',
      });
    } catch (error) {
      setEmployeeError(error.message || 'No se pudo cargar el empleado.');
      setEmployee(null);
    } finally {
      setLoadingEmployee(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    if (!editModalVisible) {
      setFormErrors({});
      return;
    }

    setFormState({
      name: employee?.name ?? '',
      role: employee?.role ?? '',
      base: employee?.base ?? '',
      number: employee?.number != null ? String(employee.number) : '',
      shift: employee?.shift ?? '',
    });
  }, [editModalVisible, employee]);

  const displayName =
    employee?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Operador';
  const roleLabel = employee?.role || user?.user_metadata?.role || 'Operador';
  const baseValue = employee?.base || user?.user_metadata?.base || '';
  const numberValue =
    employee?.number != null ? String(employee.number) : undefined;
  const shiftValue = employee?.shift || user?.user_metadata?.shift || '';

  const validateForm = () => {
    const errors = {};

    if (!formState.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (formState.number) {
      const parsedNumber = Number(formState.number);
      if (Number.isNaN(parsedNumber)) {
        errors.number = 'Introduce un número válido';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Sesión inválida', 'Vuelve a iniciar sesión e inténtalo de nuevo.');
      return;
    }

    if (!validateForm()) return;

    const payload = {
      name: formState.name.trim(),
      role: formState.role.trim(),
      base: formState.base.trim(),
      number: formState.number ? Number(formState.number) : null,
      shift: formState.shift.trim(),
    };

    try {
      const updatedEmployee = await updateEmployeeById(user.id, payload);
      setEmployee(updatedEmployee);

      const metadataResult = await updateProfile({
        full_name: payload.name,
        role: payload.role,
        base: payload.base,
        shift: payload.shift,
        employee_number: payload.number,
      });

      if (!metadataResult?.success) {
        console.warn(
          'No se pudo sincronizar metadatos del usuario:',
          metadataResult?.error,
        );
      }

      setEditModalVisible(false);
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar',
        error.message ?? 'Ocurrió un error al guardar tu perfil.',
      );
    }
  };

  const handlePasswordReset = () => {
    if (!user?.email) {
      Alert.alert(
        'Operación no disponible',
        'No se encontró un correo asociado a la cuenta.',
      );
      return;
    }

    Alert.alert(
      'Restablecer contraseña',
      `Enviaremos un correo a ${user.email} con instrucciones para restablecer tu contraseña.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          style: 'destructive',
          onPress: async () => {
            const result = await resetPassword(user.email);
            if (result.success) {
              Alert.alert(
                'Revisa tu correo',
                'Hemos enviado instrucciones para restablecer tu contraseña.',
              );
            } else {
              Alert.alert(
                'Error al enviar correo',
                result.error ?? 'Intenta nuevamente más tarde.',
              );
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar sesión en GateApp?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            const result = await signOut();
            if (result?.success) {
              router.replace('/login');
            } else {
              Alert.alert(
                'No se pudo cerrar sesión',
                result?.error ?? 'Intenta nuevamente.',
              );
            }
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const DetailRow = ({ icon, label, value }) => {
    const displayValue =
      value === null || value === undefined || value === ''
        ? 'No asignado'
        : value;

    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>{icon}</Text>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{displayValue}</Text>
        </View>
      </View>
    );
  };

  const renderEmployeeSection = () => {
    if (loadingEmployee) {
      return (
        <View style={styles.employeeLoader}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.employeeLoaderText}>
            Cargando información del empleado...
          </Text>
        </View>
      );
    }

    if (employeeError) {
      return (
        <View style={styles.employeeLoader}>
          <Text style={styles.employeeLoaderText}>{employeeError}</Text>
          <Button
            title="Reintentar"
            variant="secondary"
            size="small"
            onPress={loadEmployee}
          />
        </View>
      );
    }

    return (
      <>
        <DetailRow icon="👤" label="Nombre" value={displayName} />
        <DetailRow icon="🏷️" label="Rol" value={roleLabel} />
        <DetailRow icon="🛫" label="Base" value={baseValue} />
        <DetailRow icon="🔢" label="Número de empleado" value={numberValue} />
        <DetailRow icon="🕒" label="Turno" value={shiftValue} />
      </>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No hay sesión activa</Text>
          <Text style={styles.emptyStateSubtitle}>
            Inicia sesión para acceder a tu perfil y preferencias.
          </Text>
          <Button
            title="Ir al login"
            onPress={() => router.replace('/login')}
            size="large"
            style={styles.emptyStateButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.role}>{roleLabel}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.headerActions}>
            <Button
              title="Editar perfil"
              variant="secondary"
              size="small"
              onPress={() => setEditModalVisible(true)}
              disabled={loadingEmployee || !!employeeError}
            />
            <Button
              title="Ver actividad"
              variant="outline"
              size="small"
              onPress={() =>
                Alert.alert(
                  'Próximamente',
                  'La vista de actividad estará disponible en una siguiente versión.',
                )
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          {renderEmployeeSection()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handlePasswordReset}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.actionTitle}>Restablecer contraseña</Text>
              <Text style={styles.actionSubtitle}>
                Te enviaremos un correo con instrucciones.
              </Text>
            </View>
            <Text style={styles.actionIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                'Centro de ayuda',
                'Escríbenos a support@gateapp.mx para recibir asistencia.',
              )
            }
          >
            <View>
              <Text style={styles.actionTitle}>Contactar soporte</Text>
              <Text style={styles.actionSubtitle}>support@gateapp.mx</Text>
            </View>
            <Text style={styles.actionIcon}>›</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Cerrar sesión"
          variant="error"
          size="large"
          onPress={handleLogout}
          style={styles.logoutButton}
          loading={signingOut}
        />

        <Text style={styles.version}>v1.0.0 · HackMTY 2025 · Build mobile</Text>
      </ScrollView>

      <Modal
        animationType="slide"
        visible={editModalVisible}
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <Text style={styles.modalSubtitle}>
              Actualiza la información que se mostrará al resto del equipo.
            </Text>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Input
                label="Nombre completo"
                value={formState.name}
                onChangeText={(text) =>
                  setFormState((prev) => ({ ...prev, name: text }))
                }
                placeholder="Nombre y apellidos"
                error={formErrors.name}
                autoCapitalize="words"
              />

              <Input
                label="Rol"
                value={formState.role}
                onChangeText={(text) =>
                  setFormState((prev) => ({ ...prev, role: text }))
                }
                placeholder="Ej. Operador"
                autoCapitalize="words"
              />

              <Input
                label="Base"
                value={formState.base}
                onChangeText={(text) =>
                  setFormState((prev) => ({ ...prev, base: text }))
                }
                placeholder="Ej. MTY · Terminal C"
                autoCapitalize="words"
              />

              <Input
                label="Número de empleado"
                value={formState.number}
                onChangeText={(text) =>
                  setFormState((prev) => ({ ...prev, number: text }))
                }
                placeholder="Ej. 1024"
                keyboardType="numeric"
                error={formErrors.number}
              />

              <Input
                label="Turno"
                value={formState.shift}
                onChangeText={(text) =>
                  setFormState((prev) => ({ ...prev, shift: text }))
                }
                placeholder="Ej. Vespertino"
                autoCapitalize="words"
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Guardar cambios"
                  onPress={handleSaveProfile}
                  loading={updatingProfile}
                  style={styles.modalPrimaryButton}
                />
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setEditModalVisible(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getInitials = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'OP';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  role: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  section: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
  },
  employeeLoader: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  employeeLoaderText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actionIcon: {
    fontSize: 24,
    color: COLORS.textLight,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 12,
  },
  version: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalScrollContent: {
    paddingBottom: 12,
    gap: 12,
  },
  modalButtons: {
    gap: 12,
    marginTop: 12,
  },
  modalPrimaryButton: {
    width: '100%',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});
