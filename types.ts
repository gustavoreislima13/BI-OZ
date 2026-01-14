export enum ConsortiumType {
  AUTO = 'Automóvel',
  REAL_ESTATE = 'Imóvel',
  SERVICES = 'Serviços',
  HEAVY_MACHINERY = 'Pesados',
  MOTORCYCLE = 'Moto'
}

export enum SaleStatus {
  PENDING = 'Pendente',
  APPROVED = 'Aprovado',
  CANCELLED = 'Cancelado'
}

export interface Sale {
  id: string;
  consultantName: string;
  clientName: string;
  type: ConsortiumType;
  value: number;
  date: string; // ISO string YYYY-MM-DD
  status: SaleStatus;
}

export interface KPI {
  totalSales: number;
  totalVolume: number;
  avgTicket: number;
  topProduct: string;
}

export interface DashboardViewProps {
  sales: Sale[];
}
