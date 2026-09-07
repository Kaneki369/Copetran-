import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLocalStorage } from '@/hooks';
import { clientesSeed } from '@/data/mockData';
import type { CanalVenta, Cliente, MetodoPago, Tiquete } from '@/types/copetran';
import { AlertDialog, Badge, Button, Card, CardTitle, Input, Modal, Select } from '@/components/ui';
import { SeatMap } from './SeatMap';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate } from '@/utils/format';
import { Printer, QrCode, Ticket as TicketIcon, CheckCircle2 } from 'lucide-react';

/**
 * Códigos de descuento de demostración para el "flujo extendido de
 * descuentos" pedido en el refinamiento de UI. No corresponden a un campo
 * del schema real ni del brief (TIQUETE no tiene columna de descuento) —
 * es una convención habitual del sector (estudiante/adulto mayor) que se
 * aplica sobre VALOR_TIQUETE_BASE antes de vender (ver DataContext.venderTiquete).
 */
const CODIGOS_DESCUENTO: Record<string, number> = {
  ESTUDIANTE: 10,
  ADULTOMAYOR: 20,
};

/**
 * Módulo ECU-01 — Comprar/Vender Tiquete de Pasajero (Proceso A). Unifica el
 * flujo de autoservicio del Cliente (canal WEB/APP) y el de venta en
 * taquilla del Cajero de Agencia, con mapa de asientos interactivo y el
 * flujo extendido de reserva / tiquete abierto / descuento.
 */
export function TiquetesModule() {
  const { usuario } = useAuth();
  const { clientes, viajes, facturas, sillasDelViaje, venderTiquete, tiquetes, registrarCliente, cambiarEstadoTiquete } = useData();

  const esCliente = usuario?.rol === 'CLIENTE';

  const [clienteActual, setClienteActual] = useLocalStorage<Cliente | null>('copetran.clienteActual', clientesSeed[0]);
  const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | ''>('');
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const [searchParams] = useSearchParams();
  const viajeUrlParam = searchParams.get('viaje');
  const [idViaje, setIdViaje] = useState<number | null>(() => {
    if (viajeUrlParam) {
      const parsed = Number(viajeUrlParam);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  });
  const [idSilla, setIdSilla] = useState<number | null>(null);
  const [canal, setCanal] = useState<CanalVenta>(esCliente ? 'WEB' : 'TAQUILLA');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA_CREDITO');
  const [tipoTiquete, setTipoTiquete] = useState<'PAGADO' | 'RESERVADO' | 'ABIERTO'>('PAGADO');
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimoTiquete, setUltimoTiquete] = useState<Tiquete | null>(null);
  const [tiquetePorConfirmar, setTiquetePorConfirmar] = useState<Tiquete | null>(null);
  const [tiqueteBoleto, setTiqueteBoleto] = useState<Tiquete | null>(null);

  const idPasajero = esCliente ? clienteActual?.id_cliente ?? null : idClienteSeleccionado || null;

  const sillas = useMemo(() => (idViaje ? sillasDelViaje(idViaje) : []), [idViaje, sillasDelViaje]);
  const descuentoPorcentaje = CODIGOS_DESCUENTO[codigoDescuento.trim().toUpperCase()] ?? 0;
  const valorBase = 85000; // VALOR_TIQUETE_BASE (ver src/data/mockData.ts)
  const valorConDescuento = Math.round(valorBase * (1 - descuentoPorcentaje / 100));

  const misTiquetes = useMemo(
    () => (esCliente && clienteActual ? tiquetes.filter((t) => t.id_pasajero === clienteActual.id_cliente) : [...tiquetes].sort((a, b) => b.id_tiquete - a.id_tiquete)),
    [esCliente, clienteActual, tiquetes],
  );

  if (esCliente && !clienteActual) {
    return <RegistroCliente nombreSugerido={usuario?.nombre ?? ''} onRegistrado={setClienteActual} registrarCliente={registrarCliente} />;
  }

  async function confirmar() {
    if (!idPasajero || !idViaje || !idSilla) return;
    setError(null);
    setComprando(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const tiquete = venderTiquete({
        idViaje,
        idSilla,
        idPasajero,
        idCajero: esCliente ? 0 : 100,
        idCanalVenta: canal,
        idMetodoPago: metodoPago,
        tipoTiquete,
        descuentoPorcentaje,
      });
      setUltimoTiquete(tiquete);
      setTiqueteBoleto(tiquete);
      setIdViaje(null);
      setIdSilla(null);
      setCodigoDescuento('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible completar la operación.');
    } finally {
      setComprando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Módulo de Tiquetes (ECU-01)</h1>
        <p className="text-sm text-slate-500">
          {esCliente
            ? `Hola ${clienteActual?.nombres} ${clienteActual?.apellidos} (doc. ${clienteActual?.documento})`
            : 'Venta en nombre de un cliente registrado — canal taquilla.'}
        </p>
      </div>

      {ultimoTiquete && (
        <Card className="border-emerald-300 bg-emerald-50 flex items-center justify-between p-4">
          <p className="text-sm font-medium text-emerald-800">
            Tiquete {ultimoTiquete.numero_tiquete} generado con éxito — estado{' '}
            <Badge estado={ultimoTiquete.id_estado_tiquete} /> · {formatCurrency(ultimoTiquete.valor_pagado)}
          </p>
          <Button size="sm" onClick={() => setTiqueteBoleto(ultimoTiquete)} className="gap-1.5 shrink-0">
            <TicketIcon className="h-3.5 w-3.5" />
            Ver Pase de Abordaje
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!esCliente && (
            <Card>
              <CardTitle>1. Cliente</CardTitle>
              {!mostrarRegistro ? (
                <div className="mt-3 flex items-end gap-3">
                  <div className="flex-1">
                    <Select
                      label="Cliente registrado"
                      value={idClienteSeleccionado}
                      onChange={(e) => setIdClienteSeleccionado(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Selecciona un cliente…</option>
                      {clientes.map((c) => (
                        <option key={c.id_cliente} value={c.id_cliente}>
                          {c.nombres} {c.apellidos} — {c.documento}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setMostrarRegistro(true)}>
                    Registrar cliente nuevo
                  </Button>
                </div>
              ) : (
                <RegistroRapido
                  onCancelar={() => setMostrarRegistro(false)}
                  onRegistrado={(c) => {
                    setIdClienteSeleccionado(c.id_cliente);
                    setMostrarRegistro(false);
                  }}
                  registrarCliente={registrarCliente}
                />
              )}
            </Card>
          )}

          {idPasajero && (
            <Card>
              <CardTitle>{esCliente ? '1' : '2'}. Consultar disponibilidad de viaje</CardTitle>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
                {viajes.map((v) => (
                  <button
                    key={v.id_viaje}
                    onClick={() => {
                      setIdViaje(v.id_viaje);
                      setIdSilla(null);
                    }}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-sm transition',
                      idViaje === v.id_viaje ? 'border-copetran-500 bg-copetran-50 ring-1 ring-copetran-500' : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <span className="font-medium text-slate-900">
                      {v.origen_ciudad} → {v.destino_ciudad}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {formatDate(v.fecha)} · {v.hora_salida} · Bus {v.placa_bus}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {idViaje && (
            <Card>
              <CardTitle>{esCliente ? '2' : '3'}. Mapa de asientos</CardTitle>
              <div className="mt-3">
                <SeatMap sillas={sillas} idSillaSeleccionada={idSilla} onSeleccionar={setIdSilla} />
              </div>
            </Card>
          )}

          {idViaje && idSilla && (
            <Card>
              <CardTitle>{esCliente ? '3' : '4'}. Canal, pago, tipo de tiquete y descuento</CardTitle>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Select label="Canal de venta" value={canal} onChange={(e) => setCanal(e.target.value as CanalVenta)} disabled={!esCliente}>
                  {esCliente ? (
                    <>
                      <option value="WEB">WEB</option>
                      <option value="APP">APP</option>
                    </>
                  ) : (
                    <option value="TAQUILLA">TAQUILLA</option>
                  )}
                </Select>
                <Select
                  label="Método de pago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  disabled={tipoTiquete === 'RESERVADO'}
                >
                  {esCliente ? null : <option value="EFECTIVO">Efectivo</option>}
                  <option value="TARJETA_CREDITO">Tarjeta de crédito</option>
                  <option value="TARJETA_DEBITO">Tarjeta débito</option>
                  <option value="TRANSFERENCIA">Transferencia / QR</option>
                </Select>
                <Select label="Tipo de tiquete" value={tipoTiquete} onChange={(e) => setTipoTiquete(e.target.value as typeof tipoTiquete)}>
                  <option value="PAGADO">Pago inmediato</option>
                  <option value="RESERVADO">Reserva sin pago (A1)</option>
                  <option value="ABIERTO">Tiquete abierto (A2)</option>
                </Select>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Código de descuento (opcional)</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <Input
                    value={codigoDescuento}
                    onChange={(e) => setCodigoDescuento(e.target.value)}
                    placeholder="Ej: ESTUDIANTE, ADULTOMAYOR"
                    className="max-w-xs"
                  />
                  {codigoDescuento.trim() && (
                    <span className={cn('text-xs font-medium', descuentoPorcentaje > 0 ? 'text-emerald-600' : 'text-rose-500')}>
                      {descuentoPorcentaje > 0 ? `Descuento aplicado: ${descuentoPorcentaje}%` : 'Código no reconocido'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  Valor tiquete:{' '}
                  {descuentoPorcentaje > 0 ? (
                    <>
                      <span className="text-slate-400 line-through">{formatCurrency(valorBase)}</span>{' '}
                      <span className="font-semibold text-emerald-700">{formatCurrency(valorConDescuento)}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{formatCurrency(valorBase)}</span>
                  )}
                  {tipoTiquete === 'RESERVADO' && <span className="text-slate-400"> (se cobra al confirmar el pago)</span>}
                </p>
              </div>

              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

              <Button onClick={confirmar} loading={comprando} className="mt-4">
                {esCliente ? 'Confirmar compra' : 'Confirmar venta'}
              </Button>
            </Card>
          )}
        </div>

        <aside className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardTitle className="text-base">{esCliente ? 'Mis tiquetes' : 'Ventas recientes'}</CardTitle>
            <p className="mt-0.5 text-xs text-slate-400">Panel de auditoría</p>
            {misTiquetes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Todavía no hay tiquetes.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {misTiquetes.map((t) => {
                  const viaje = viajes.find((v) => v.id_viaje === t.id_viaje);
                  const cliente = clientes.find((c) => c.id_cliente === t.id_pasajero);
                  return (
                    <li key={t.id_tiquete} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800">{t.numero_tiquete}</span>
                        <Badge estado={t.id_estado_tiquete} className="shrink-0" />
                      </div>
                      {!esCliente && cliente && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {cliente.nombres} {cliente.apellidos}
                        </p>
                      )}
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {viaje ? `${viaje.origen_ciudad} → ${viaje.destino_ciudad}` : ''}
                      </p>
                      <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-300 pt-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700">{formatCurrency(t.valor_pagado)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTiqueteBoleto(t)}
                            className="text-[11px] font-bold text-copetran-600 hover:text-copetran-800 underline flex items-center gap-1"
                          >
                            <TicketIcon className="h-3 w-3" />
                            Ver Boleto
                          </button>
                          {t.id_estado_tiquete === 'RESERVADO' && (
                            <Button variant="secondary" size="sm" onClick={() => setTiquetePorConfirmar(t)} className="!px-2 !py-0.5 text-[10px]">
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <AlertDialog
        open={tiquetePorConfirmar !== null}
        onClose={() => setTiquetePorConfirmar(null)}
        onConfirm={() => {
          if (tiquetePorConfirmar) cambiarEstadoTiquete(tiquetePorConfirmar.id_tiquete, 'PAGADO');
          setTiquetePorConfirmar(null);
        }}
        title="Confirmar pago"
        description={
          tiquetePorConfirmar ? `¿Confirmar el pago del tiquete ${tiquetePorConfirmar.numero_tiquete}? Pasará de RESERVADO a PAGADO.` : undefined
        }
        confirmLabel="Sí, confirmar pago"
      />

      {/* MODAL PASE DE ABORDAJE / TIQUETE ELECTRÓNICO IMPRIMIBLE */}
      {tiqueteBoleto && (
        <Modal
          open={true}
          onClose={() => setTiqueteBoleto(null)}
          className="max-w-xl p-0 overflow-hidden border-2 border-copetran-600 rounded-3xl"
        >
          {/* Cabecera del Boleto */}
          <div className="bg-gradient-to-r from-copetran-700 via-copetran-600 to-blue-700 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white p-0.5 rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                <img src="/assets/copetran-square.png" alt="Copetran" className="h-full w-full object-cover rounded-lg" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide flex items-center gap-2">
                  PASE DE ABORDAJE ELECTRÓNICO
                </h3>
                <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-widest">
                  Copetran — La Fuerza Que Mueve a Colombia
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-blue-200 block">TIQUETE Nº</span>
              <span className="font-mono text-sm font-black text-amber-300">{tiqueteBoleto.numero_tiquete}</span>
            </div>
          </div>

          {/* Cuerpo del Boleto */}
          <div className="p-6 bg-slate-50 space-y-4">
            {/* Ruta y Silla */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trayecto</span>
                <p className="text-lg font-black text-slate-900">
                  {viajes.find((v) => v.id_viaje === tiqueteBoleto.id_viaje)?.origen_ciudad ?? 'Bucaramanga'} →{' '}
                  {viajes.find((v) => v.id_viaje === tiqueteBoleto.id_viaje)?.destino_ciudad ?? 'Bogotá'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salida:{' '}
                  <strong>
                    {viajes.find((v) => v.id_viaje === tiqueteBoleto.id_viaje)?.hora_salida ?? '06:00'} hrs
                  </strong>{' '}
                  • Fecha:{' '}
                  {formatDate(viajes.find((v) => v.id_viaje === tiqueteBoleto.id_viaje)?.fecha ?? '2026-09-08')}
                </p>
              </div>

              <div className="text-center bg-copetran-50 border border-copetran-200 rounded-xl px-4 py-2">
                <span className="text-[10px] font-bold text-copetran-700 uppercase block">Silla Asignada</span>
                <span className="text-2xl font-black text-copetran-700">
                  #{tiqueteBoleto.id_silla % 100}
                </span>
                <span className="text-[9px] font-semibold text-slate-500 block">
                  {tiqueteBoleto.id_silla % 100 <= 8 ? 'Piso 1 · VIP Cama' : 'Piso 2 · Confort'}
                </span>
              </div>
            </div>

            {/* Datos del Pasajero y Facturación */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pasajero</span>
                <strong className="text-slate-800 text-sm">
                  {(() => {
                    const c = clientes.find((cl) => cl.id_cliente === tiqueteBoleto.id_pasajero);
                    return c ? `${c.nombres} ${c.apellidos}` : 'Pasajero General';
                  })()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Documento</span>
                <strong className="text-slate-800 text-sm">
                  {clientes.find((cl) => cl.id_cliente === tiqueteBoleto.id_pasajero)?.documento ?? '1098765432'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado</span>
                <Badge estado={tiqueteBoleto.id_estado_tiquete} className="mt-0.5" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Canal de Venta</span>
                <span className="font-semibold text-slate-700">{tiqueteBoleto.id_canal_venta}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Método de Pago</span>
                <span className="font-semibold text-slate-700">
                  {facturas.find((f) => f.id_factura === tiqueteBoleto.id_factura)?.id_metodo_pago ?? 'EFECTIVO'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pagado</span>
                <strong className="text-copetran-600 font-extrabold text-sm">
                  {formatCurrency(tiqueteBoleto.valor_pagado)}
                </strong>
              </div>
            </div>

            {/* Simulación de QR y DIAN / CUFE */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-dashed border-slate-300">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 bg-slate-900 text-white rounded-xl flex items-center justify-center p-1.5 shadow-sm">
                  <QrCode className="h-full w-full text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Boleto Válido para Abordaje
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    CUFE: 84a9f...38bc (Factura Electrónica DIAN)
                  </p>
                  <p className="text-[10px] text-slate-400">Presenta este comprobante en taquilla o abordaje.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 font-bold"
            >
              <Printer className="h-4 w-4" />
              Imprimir Pasaje
            </Button>
            <Button size="sm" onClick={() => setTiqueteBoleto(null)}>
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RegistroCliente({
  nombreSugerido,
  onRegistrado,
  registrarCliente,
}: {
  nombreSugerido: string;
  onRegistrado: (c: Cliente) => void;
  registrarCliente: (datos: Omit<Cliente, 'id_cliente'>) => Cliente;
}) {
  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState(nombreSugerido);
  const [apellidos, setApellidos] = useState('');
  const [celular, setCelular] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!documento || !nombres || !apellidos) return;
    onRegistrado(registrarCliente({ documento, nombres, apellidos, celular }));
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Registro de cliente</CardTitle>
      <p className="mt-1 text-sm text-slate-500">
        Proceso M — primera vez que compras un tiquete se registra tu documento, nombre y celular; en compras posteriores se reutiliza el mismo
        registro.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Input placeholder="Documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
        <Input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
        <Input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
        <Input placeholder="Celular" value={celular} onChange={(e) => setCelular(e.target.value)} />
        <Button type="submit" fullWidth>
          Continuar
        </Button>
      </form>
    </Card>
  );
}

function RegistroRapido({
  onRegistrado,
  onCancelar,
  registrarCliente,
}: {
  onRegistrado: (c: { id_cliente: number }) => void;
  onCancelar: () => void;
  registrarCliente: (datos: { documento: string; nombres: string; apellidos: string; celular?: string }) => { id_cliente: number };
}) {
  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!documento || !nombres || !apellidos) return;
        onRegistrado(registrarCliente({ documento, nombres, apellidos }));
      }}
      className="mt-3 grid gap-2 sm:grid-cols-4"
    >
      <Input placeholder="Documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
      <Input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
      <Input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
