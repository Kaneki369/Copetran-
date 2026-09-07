import { useSearchParams } from 'react-router-dom';
import { ListChecks, Package, Ticket } from 'lucide-react';
import { Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui';
import { TrazabilidadTab } from '@/components/workspace/TrazabilidadTab';
import { TiquetesModule } from '@/components/workspace/TiquetesModule';
import { MensajeriaModule } from '@/components/workspace/MensajeriaModule';

const TABS: TabItem[] = [
  { id: 'trazabilidad', label: 'Trazabilidad del Sistema', icon: <ListChecks className="h-4 w-4" />, content: <TrazabilidadTab /> },
  { id: 'tiquetes', label: 'Módulo de Tiquetes (ECU-01)', icon: <Ticket className="h-4 w-4" />, content: <TiquetesModule /> },
  { id: 'mensajeria', label: 'Módulo de Mensajería (ECU-02)', icon: <Package className="h-4 w-4" />, content: <MensajeriaModule /> },
];

/**
 * Contenedor principal del workspace: estructura de tabs que alterna entre
 * la trazabilidad del sistema y los dos módulos de proceso (ECU-01, ECU-02).
 * Se monta como ruta índice dentro de <DashboardLayout />.
 */
export function DashboardRouter() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'trazabilidad';
  return <Tabs tabs={TABS} defaultTabId={tabParam} key={tabParam} />;
}
