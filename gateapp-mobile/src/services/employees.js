import { supabase } from './supabase';

export const getEmployeeById = async (id) => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, role, base, number, shift')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateEmployeeById = async (id, payload) => {
  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select('id, name, role, base, number, shift')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
