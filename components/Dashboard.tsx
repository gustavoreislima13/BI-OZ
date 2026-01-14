import React, { useMemo } from 'react';
import { Sale, ConsortiumType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, FileText, TrendingUp, Award } from 'lucide-react';
import { StatsCard } from './StatsCard';

interface DashboardProps {
  sales: Sale[];
}

// Ademicon Palette: Navy (#003057), Red (#D31145), Light Blue (#009CDE), Grays
const COLORS = ['#003057', '#D31145', '#009CDE', '#64748b', '#94a3b8'];

export const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  
  const metrics = useMemo(() => {
    const totalVolume = sales.reduce((acc, curr) => acc + curr.value, 0);
    const totalCount = sales.length;
    const avgTicket = totalCount > 0 ? totalVolume / totalCount : 0;
    
    // Top Consultant logic
    const consultantMap = new Map<string, number>();
    sales.forEach(s => {
      consultantMap.set(s.consultantName, (consultantMap.get(s.consultantName) || 0) + s.value);
    });
    let topConsultant = 'N/A';
    let maxVal = 0;
    consultantMap.forEach((val, key) => {
      if (val > maxVal) {
        maxVal = val;
        topConsultant = key;
      }
    });

    return { totalVolume, totalCount, avgTicket, topConsultant };
  }, [sales]);

  const salesByType = useMemo(() => {
    const data: Record<string, number> = {};
    sales.forEach(s => {
      data[s.type] = (data[s.type] || 0) + s.value;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [sales]);

  const salesByConsultant = useMemo(() => {
     const data: Record<string, number> = {};
    sales.forEach(s => {
      data[s.consultantName] = (data[s.consultantName] || 0) + s.value;
    });
    return Object.keys(data).map(key => ({ name: key, vendas: data[key] })).sort((a,b) => b.vendas - a.vendas);
  }, [sales]);

  const salesOverTime = useMemo(() => {
     // Simple grouping by date for line chart
     const data: Record<string, number> = {};
     // Sort sales by date first
     const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     
     sortedSales.forEach(s => {
        // Format date as DD/MM
        const dateObj = new Date(s.date);
        const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        data[dateStr] = (data[dateStr] || 0) + s.value;
     });
     return Object.keys(data).map(key => ({ date: key, valor: data[key] }));
  }, [sales]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Volume Total" 
          value={formatCurrency(metrics.totalVolume)} 
          icon={DollarSign} 
          colorClass="bg-[#003057]" // Navy
          trend="+12% vs mês anterior"
        />
        <StatsCard 
          title="Cotas Vendidas" 
          value={metrics.totalCount.toString()} 
          icon={FileText} 
          colorClass="bg-[#D31145]" // Red
        />
        <StatsCard 
          title="Ticket Médio" 
          value={formatCurrency(metrics.avgTicket)} 
          icon={TrendingUp} 
          colorClass="bg-[#009CDE]" // Light Blue
        />
        <StatsCard 
          title="Top Consultor" 
          value={metrics.topConsultant} 
          icon={Award} 
          colorClass="bg-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Type (Pie) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#003057] mb-4">Distribuição por Tipo de Bem</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Consultant (Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#003057] mb-4">Ranking de Consultores (Volume)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesByConsultant}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `R$${val/1000}k`} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'transparent'}} />
                <Bar dataKey="vendas" fill="#003057" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Trend (Line) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
           <h3 className="text-lg font-bold text-[#003057] mb-4">Evolução de Vendas (Cronograma)</h3>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="valor" stroke="#D31145" strokeWidth={3} dot={{r: 4, fill: '#D31145'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};