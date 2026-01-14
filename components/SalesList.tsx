import React, { useState, useMemo, useRef } from 'react';
import { Sale, SaleStatus, ConsortiumType } from '../types';
import { Download, Filter, XCircle, User, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SalesListProps {
  sales: Sale[];
  onImportSales?: (sales: Sale[]) => Promise<void>;
}

export const SalesList: React.FC<SalesListProps> = ({ sales, onImportSales }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique consultant names from sales
  const consultants = useMemo(() => {
    const names = sales.map(s => s.consultantName);
    return Array.from(new Set(names)).sort();
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (startDate && sale.date < startDate) return false;
      if (endDate && sale.date > endDate) return false;
      if (selectedConsultant && sale.consultantName !== selectedConsultant) return false;
      return true;
    });
  }, [sales, startDate, endDate, selectedConsultant]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Consultor', 'Cliente', 'Tipo', 'Valor', 'Status'];
    const rows = filteredSales.map(sale => [
      sale.id,
      sale.date,
      `"${sale.consultantName}"`,
      `"${sale.clientName}"`,
      sale.type,
      sale.value.toFixed(2),
      sale.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processCSV = async (text: string) => {
    try {
      setIsImporting(true);
      const lines = text.split('\n');
      // Assume first line is header
      const dataLines = lines.slice(1).filter(line => line.trim() !== '');
      const newSales: Sale[] = [];

      dataLines.forEach(line => {
        // Simple CSV splitter that respects quotes for names
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length >= 6) {
           const date = columns[1];
           const consultantName = columns[2];
           const clientName = columns[3];
           const typeStr = columns[4];
           const valueStr = columns[5];
           const statusStr = columns[6];

           // Map Type string to Enum
           let type = ConsortiumType.AUTO;
           if (Object.values(ConsortiumType).includes(typeStr as ConsortiumType)) {
             type = typeStr as ConsortiumType;
           }

           // Map Status string to Enum
           let status = SaleStatus.PENDING;
           if (Object.values(SaleStatus).includes(statusStr as SaleStatus)) {
             status = statusStr as SaleStatus;
           }

           const value = parseFloat(valueStr);

           if (date && consultantName && !isNaN(value)) {
             newSales.push({
               id: uuidv4(),
               date: date, 
               consultantName,
               clientName,
               type,
               value,
               status
             });
           }
        }
      });

      if (newSales.length > 0 && onImportSales) {
        await onImportSales(newSales);
      } else {
        alert("Nenhuma venda válida encontrada no arquivo. Verifique o formato.");
      }
    } catch (error) {
      console.error("Erro ao processar CSV", error);
      alert("Erro ao ler o arquivo CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result as string;
      processCSV(text);
      // Reset input
      if (event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedConsultant('');
  };

  const getStatusColor = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case SaleStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case SaleStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#003057]">Histórico de Vendas</h3>
          <span className="text-sm text-gray-500">
            {filteredSales.length} {filteredSales.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-wrap">
             <Filter size={16} className="text-gray-400" />
             
             {/* Date Filter */}
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-[#003057] uppercase">De</span>
               <input 
                 type="date" 
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="bg-transparent text-sm text-gray-700 outline-none w-28 md:w-32"
               />
             </div>
             <div className="w-px h-8 bg-gray-200 mx-1"></div>
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-[#003057] uppercase">Até</span>
               <input 
                 type="date" 
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="bg-transparent text-sm text-gray-700 outline-none w-28 md:w-32"
               />
             </div>

             <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

             {/* Consultant Filter */}
             <div className="flex flex-col w-full md:w-auto mt-2 md:mt-0">
               <span className="text-[10px] font-bold text-[#003057] uppercase flex items-center gap-1">
                 <User size={10} /> Consultor
               </span>
               <select
                 value={selectedConsultant}
                 onChange={(e) => setSelectedConsultant(e.target.value)}
                 className="bg-transparent text-sm text-gray-700 outline-none w-full md:w-40 cursor-pointer"
               >
                 <option value="">Todos</option>
                 {consultants.map(c => (
                   <option key={c} value={c}>{c}</option>
                 ))}
               </select>
             </div>

             {(startDate || endDate || selectedConsultant) && (
                <button onClick={clearFilters} className="text-gray-400 hover:text-[#D31145] transition ml-1" title="Limpar Filtros">
                  <XCircle size={16} />
                </button>
             )}
          </div>

          <div className="flex gap-2">
            {onImportSales && (
              <button 
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-[#003057] text-[#003057] hover:bg-gray-50 rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title="Importar CSV (Excel)"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span className="hidden sm:inline">{isImporting ? 'Importando...' : 'Importar'}</span>
              </button>
            )}

            <button 
              onClick={handleExportCSV}
              disabled={filteredSales.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-[#003057] hover:bg-[#002240] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-[#003057] font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Consultor</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <Filter size={24} className="text-gray-300" />
                  </div>
                  <p>Nenhuma venda encontrada para os filtros selecionados.</p>
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(sale.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#003057]">{sale.consultantName}</td>
                  <td className="px-6 py-4">{sale.clientName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[#F5F7FA] text-[#003057] rounded-md text-xs font-medium border border-gray-200">
                      {sale.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#003057]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};