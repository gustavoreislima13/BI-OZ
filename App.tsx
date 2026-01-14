import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlusSquare, Table, BrainCircuit, BarChart3, Menu, X, Database, PanelLeftClose, PanelLeftOpen, Loader2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { SalesEntry } from './components/SalesEntry';
import { SalesList } from './components/SalesList';
import { AIAnalyst } from './components/AIAnalyst';
import { getSales, addSale, generateMockData, saveSales, updateSale, deleteSale } from './services/storage';
import { Sale } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'entry' | 'list' | 'ai'>('dashboard');
  const [sales, setSales] = useState<Sale[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isConsultantMode, setIsConsultantMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch latest data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getSales();
      setSales(data);
    } catch (error) {
      console.error("Failed to fetch sales", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check URL params for consultant mode
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    
    if (mode === 'consultant') {
      setIsConsultantMode(true);
      setCurrentView('entry');
    }

    // Initial load
    fetchData();
  }, []);

  const handleAddSale = async (newSale: Sale) => {
    try {
      setIsLoading(true);
      await addSale(newSale);
      await fetchData(); // Refresh data from server
      alert('Venda salva com sucesso!');
    } catch (error) {
      alert('Erro ao salvar venda. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSale = async (updatedSale: Sale) => {
    try {
      setIsLoading(true);
      await updateSale(updatedSale);
      await fetchData();
      alert('Venda atualizada com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar venda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteSale(id);
      await fetchData();
    } catch (error) {
      alert('Erro ao excluir venda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSales = async (newSales: Sale[]) => {
    try {
      setIsLoading(true);
      await saveSales(newSales);
      await fetchData();
      alert(`${newSales.length} vendas importadas com sucesso!`);
    } catch (error) {
      alert('Erro ao importar vendas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMock = async () => {
    if(confirm("Isso irá adicionar dados de exemplo ao seu banco de dados Supabase. Confirmar?")) {
      try {
        setIsLoading(true);
        await generateMockData();
        await fetchData();
      } catch (e) {
        alert("Erro ao gerar dados.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view as any);
        setIsSidebarOpen(false); // Close mobile sidebar on selection
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view 
          ? 'bg-red-50 text-[#D31145] font-bold shadow-sm border-l-4 border-[#D31145]' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-[#003057]'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const getPageTitle = () => {
    if (isConsultantMode) return 'Área do Consultor';
    
    switch(currentView) {
      case 'dashboard': return 'Dashboard';
      case 'entry': return 'Nova Venda';
      case 'list': return 'Relatórios';
      case 'ai': return 'Inteligência Artificial';
      default: return 'Consórcio BI';
    }
  };

  // Render simplified layout for consultant mode
  if (isConsultantMode) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-4 flex flex-col items-center justify-center">
         <div className="w-full max-w-2xl mb-6 flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-[#D31145] rounded-xl flex items-center justify-center shadow-sm">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#003057]">Ademicon BI</h1>
         </div>
         {isLoading ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#003057]" size={40} /></div>
         ) : (
           <SalesEntry onAddSale={handleAddSale} isStandalone={true} />
         )}
         <div className="mt-8 text-center text-sm text-gray-400">
           <p>Portal exclusivo para cadastro de vendas.</p>
           <a href="/" className="text-[#D31145] hover:underline mt-2 inline-block">Voltar para Login Admin</a>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 
          bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out
          w-64 flex-shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0
          ${isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:border-r-0 lg:overflow-hidden'}
        `}
      >
        <div className="h-full flex flex-col w-64">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 h-20">
            <div className="w-8 h-8 bg-[#D31145] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#003057] tracking-tight whitespace-nowrap">Consórcio BI</h1>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="entry" icon={PlusSquare} label="Lançar Venda" />
            <NavItem view="list" icon={Table} label="Relatórios" />
            <div className="pt-4 pb-2">
              <div className="text-xs font-bold text-[#003057] opacity-50 uppercase tracking-wider px-4 mb-2 whitespace-nowrap">Inteligência</div>
              <NavItem view="ai" icon={BrainCircuit} label="IA Analista" />
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100">
             <button onClick={handleGenerateMock} disabled={isLoading} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#D31145] transition p-2 w-full whitespace-nowrap disabled:opacity-50">
                <Database size={14} />
                {isLoading ? 'Carregando...' : 'Gerar Dados de Teste'}
             </button>
             <p className="text-xs text-center text-gray-400 mt-4 whitespace-nowrap">v2.0.0 • Supabase Connected</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#D31145] rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-[#003057]">Consórcio BI</span>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
             {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between shrink-0 h-20">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                  className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[#003057] rounded-lg transition-colors"
                  title={isDesktopSidebarOpen ? "Recolher Menu" : "Expandir Menu"}
                >
                  {isDesktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                </button>
                <h2 className="text-xl font-bold text-[#003057]">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-gray-600">Consultor</span>
               <div className="w-9 h-9 rounded-full bg-[#003057] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                 AD
               </div>
            </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {isLoading && currentView !== 'entry' ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="animate-spin text-[#D31145] mb-4" size={48} />
                <p className="text-[#003057] font-medium">Sincronizando dados...</p>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-[#003057]">Visão Geral</h2>
                      <p className="text-gray-500">Acompanhe os indicadores chave de performance do escritório.</p>
                    </div>
                    <Dashboard sales={sales} />
                  </>
                )}

                {currentView === 'entry' && (
                  <SalesEntry onAddSale={handleAddSale} />
                )}

                {currentView === 'list' && (
                  <SalesList 
                    sales={sales} 
                    onImportSales={handleImportSales} 
                    onUpdateSale={handleUpdateSale}
                    onDeleteSale={handleDeleteSale}
                  />
                )}

                {currentView === 'ai' && (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-[#003057]">Inteligência Artificial</h2>
                      <p className="text-gray-500">Use o Gemini para encontrar padrões e oportunidades nas suas vendas.</p>
                    </div>
                    <AIAnalyst sales={sales} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;