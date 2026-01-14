import { Sale, ConsortiumType, SaleStatus } from '../types';
import { supabase } from './supabase';

const mapFromDb = (row: any): Sale => ({
  id: row.id,
  consultantName: row.consultant_name,
  clientName: row.client_name,
  type: row.type as ConsortiumType,
  value: Number(row.value),
  date: row.date,
  status: row.status as SaleStatus,
});

const mapToDb = (sale: Sale) => ({
  id: sale.id, // Include ID so it persists in mock store and can be referenced later
  consultant_name: sale.consultantName,
  client_name: sale.clientName,
  type: sale.type,
  value: sale.value,
  date: sale.date,
  status: sale.status,
});

export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', JSON.stringify(error));
    return [];
  }

  return (data || []).map(mapFromDb);
};

export const saveSales = async (sales: Sale[]): Promise<void> => {
  const dbRows = sales.map(mapToDb);
  const { error } = await supabase
    .from('sales')
    .insert(dbRows);

  if (error) {
    console.error('Error bulk saving sales:', JSON.stringify(error));
    throw error;
  }
};

export const addSale = async (sale: Sale): Promise<void> => {
  const dbRow = mapToDb(sale);
  const { error } = await supabase
    .from('sales')
    .insert([dbRow]);

  if (error) {
    console.error('Error adding sale:', JSON.stringify(error));
    throw error;
  }
};

export const updateSale = async (sale: Sale): Promise<void> => {
  const dbRow = mapToDb(sale);
  
  const { error } = await supabase
    .from('sales')
    .update(dbRow)
    .eq('id', sale.id);

  if (error) {
    console.error('Error updating sale:', JSON.stringify(error));
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting sale:', JSON.stringify(error));
    throw error;
  }
};

export const generateMockData = async (): Promise<Sale[]> => {
  const mockSales: Sale[] = [
    { id: '1', consultantName: 'Ana Silva', clientName: 'Transportadora Veloz', type: ConsortiumType.HEAVY_MACHINERY, value: 450000, date: '2024-05-10', status: SaleStatus.APPROVED },
    { id: '2', consultantName: 'Carlos Souza', clientName: 'João Ferreira', type: ConsortiumType.AUTO, value: 80000, date: '2024-05-12', status: SaleStatus.APPROVED },
  ];
  
  const dbRows = mockSales.map(mapToDb);
  const { error } = await supabase.from('sales').insert(dbRows);
  
  if (error) {
    console.error("Error generating mock data", JSON.stringify(error));
    return [];
  }
  return mockSales;
};