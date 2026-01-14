import React, { useState, useMemo, useRef } from 'react';
import { Sale, SaleStatus, ConsortiumType } from '../types';
import { Download, Filter, XCircle, User, Upload, Loader2, Edit2, Trash2, X, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SalesListProps {
  sales: Sale[];
  onImportSales?: (sales: Sale[]) => Promise<void>;
  onUpdateSale?: (sale: Sale) => Promise<void>;
  onDeleteSale?: (id: string) => Promise<void>;
}

export const SalesList: React.FC<SalesListProps> = ({ sales, onImportSales, onUpdateSale, onDeleteSale }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const processCSV = async (text: string) => {
    try {
      setIsImporting(true);
      const lines = text.split('\n');
      const dataLines = lines.slice(1).filter(line => line.trim() !== '');
      const newSales: Sale[] = [];

      dataLines.forEach(line => {
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));
        if (columns.length >= 6) {
           const [_, date, consultantName, clientName, typeStr, valueStr, statusStr] = columns;
           
           let type = ConsortiumType.AUTO;
           if (Object.values(ConsortiumType).includes(typeStr as ConsortiumType)) type = typeStr as ConsortiumType;

           let status = SaleStatus.PENDING;
           if (Object.values(SaleStatus).includes(statusStr as SaleStatus)) status = statusStr as SaleStatus;

           const value = parseFloat(valueStr);

           if (date && consultantName && !isNaN(value)) {
             newSales.push({ id: uuidv4(), date, consultantName, clientName, type, value, status });
           }
        }
      });

      if (newSales.length > 0 && onImportSales) await onImportSales(newSales);
      else alert("Nenhuma venda válida encontrada.");
    } catch (error) {
      console.error(error);
      alert("Erro ao ler o CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      processCSV(ev.target?.result as string);
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedConsultant('');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      if (onDeleteSale) await onDeleteSale(id);
    }
  };

  const handleEditClick = (sale: Sale) => setEditingSale({ ...sale });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale || !onUpdateSale) return;
    setIsSaving(true);
    try {
      await onUpdateSale(editingSale);
      setEditingSale(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingSale) return;
    const { name, value } = e.target;
    setEditingSale(prev => prev ? ({ ...prev, [name]: name === 'value' ? parseFloat(value) : value }) : null);
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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />

        <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#003057]">Histórico de Vendas</h3>
            <span className="text-sm text-gray-500">{filteredSales.length} registros</span>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-wrap">
               <Filter size={16} className="text-gray-400" />
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-[#003057] uppercase">De</span>
                 <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-28 md:w-32" />
               </div>
               <div className="w-px h-8 bg-gray-200 mx-1"></div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-[#003057] uppercase">Até</span>
                 <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-28 md:w-32" />
               </div>
               <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>
               <div className="flex flex-col w-full md:w-auto mt-2 md:mt-0">
                 <span className="text-[10px] font-bold text-[#003057] uppercase flex items-center gap-1"><User size={10} /> Consultor</span>
                 <select value={selectedConsultant} onChange={(e) => setSelectedConsultant(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-full md:w-40 cursor-pointer">
                   <option value="">Todos</option>
                   {consultants.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               {(startDate || endDate || selectedConsultant) && (
                  <button onClick={clearFilters} className="text-gray-400 hover:text-[#D31145] transition ml-1"><XCircle size={16} /></button>
               )}
            </div>

            <div className="flex gap-2">
              {onImportSales && (
                <button onClick={handleImportClick} disabled={isImporting} className="flex items-center gap-2 px-4 py-3 bg-white border border-[#003057] text-[#003057] hover:bg-gray-50 rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap disabled:opacity-50">
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span className="hidden sm:inline">Importar</span>
                </button>
              )}
              <button onClick={handleExportCSV} disabled={filteredSales.length === 0} className="flex items-center gap-2 px-4 py-3 bg-[#003057] hover:bg-[#002240] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap">
                <Download size={16} />
                <span className="hidden sm:inline">Exportar</span>
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
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium text-[#003057]">{sale.consultantName}</td>
                    <td className="px-6 py-4">{sale.clientName}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-[#F5F7FA] text-[#003057] rounded-md text-xs font-medium border border-gray-200">{sale.type}</span></td>
                    <td className="px-6 py-4 font-bold text-[#003057]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>{sale.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button onClick={() => handleEditClick(sale)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition" title="Editar"><Edit2 size={16} /></button>
                         <button onClick={() => handleDelete(sale.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#003057]">Editar Venda</h3>
              <button onClick={() => setEditingSale(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Consultor</label>
                 <input type="text" name="consultantName" value={editingSale.consultantName} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D31145] outline-none" required />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                 <input type="text" name="clientName" value={editingSale.clientName} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D31145] outline-none" required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Bem</label>
                    <select name="type" value={editingSale.type} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D31145] outline-none">
                      {Object.values(ConsortiumType).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                   <input type="number" name="value" value={editingSale.value} onChange={handleEditChange} step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D31145] outline-none" required />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                   <input type="date" name="date" value={editingSale.date} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D31145] outline-none" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={editingSale.status} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D31145] outline-none">
                      {Object.values(SaleStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                 </div>
               </div>
               <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setEditingSale(null)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                 <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-[#D31145] hover:bg-[#b00e3a] rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-70">
                   {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};