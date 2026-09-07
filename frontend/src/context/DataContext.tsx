import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  clientesSeed,
  facturasSeed,
  generarSillas,
  guiasSeed,
  remesasSeed,
  sillasPorBus,
  tiquetesSeed,
  TARIFA_POR_KG,
  VALOR_TIQUETE_BASE,
  viajesProgramadosSeed,
} from '../data/mockData';
import type {
  CanalVenta,
  CategoriaMercancia,
  Cliente,
  EstadoGuia,
  EstadoTiquete,
  Factura,
  GuiaEnvio,
  MetodoPago,
  Remesa,
  Silla,
  Tiquete,
  ViajeProgramado,
} from '../types/copetran';

/**
 * Transiciones válidas según los diagramas de estados ya entregados en
 * docs/parcial-primer-corte/diagramas/estados/. El store mock no permite
 * saltarse estos caminos, para que la interfaz refleje fielmente el modelo.
 */
const TRANSICIONES_TIQUETE: Record<EstadoTiquete, EstadoTiquete[]> = {
  RESERVADO: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ABIERTO', 'VIAJADO', 'CANCELADO'],
  ABIERTO: ['PAGADO', 'CANCELADO'],
  VIAJADO: [],
  CANCELADO: [],
};

const TRANSICIONES_GUIA: Record<EstadoGuia, EstadoGuia[]> = {
  ADMITIDO: ['EN_TRANSITO', 'NOVEDAD'],
  EN_TRANSITO: ['BODEGA_DESTINO', 'NOVEDAD'],
  BODEGA_DESTINO: ['ENTREGADO', 'NOVEDAD'],
  NOVEDAD: ['EN_TRANSITO', 'BODEGA_DESTINO'],
  ENTREGADO: [],
};

interface VenderTiqueteParams {
  idViaje: number;
  idSilla: number;
  idPasajero: number;
  idCajero: number;
  idCanalVenta: CanalVenta;
  idMetodoPago: MetodoPago;
  /** ECU-01: flujo base (PAGADO) o extensiones A1 (RESERVADO) / A2 (ABIERTO). */
  tipoTiquete: 'PAGADO' | 'RESERVADO' | 'ABIERTO';
  /**
   * Descuento aplicado sobre VALOR_TIQUETE_BASE (0-100). No corresponde a un
   * campo del schema real ni del brief — es una convención de UI para la
   * interfaz del Módulo de Tiquetes (código de descuento estudiante/adulto
   * mayor). Por defecto 0, no afecta las llamadas existentes.
   */
  descuentoPorcentaje?: number;
}

export interface SillaConEstado extends Silla {
  ocupada: boolean;
}

interface AdmitirGuiaParams {
  idRemitente: number;
  idDestinatario: number;
  categoria: CategoriaMercancia;
  pesoKg: number;
  idCajero: number;
  idMetodoPago: MetodoPago;
  /** ECU-02 flujo alterno A1: paga en el momento de la admisión. */
  pagaInmediato: boolean;
}

interface DataContextValue {
  clientes: Cliente[];
  viajes: ViajeProgramado[];
  tiquetes: Tiquete[];
  facturas: Factura[];
  guias: GuiaEnvio[];
  remesas: Remesa[];
  sillasDisponibles: (idViaje: number) => Silla[];
  /** Layout completo del bus del viaje, con estado ocupada/libre por silla (para el mapa de asientos). */
  sillasDelViaje: (idViaje: number) => SillaConEstado[];
  registrarCliente: (datos: Omit<Cliente, 'id_cliente'>) => Cliente;
  venderTiquete: (params: VenderTiqueteParams) => Tiquete;
  cambiarEstadoTiquete: (idTiquete: number, nuevoEstado: EstadoTiquete) => boolean;
  admitirGuia: (params: AdmitirGuiaParams) => GuiaEnvio;
  consolidarEnRemesa: (idGuia: number, idRemesaExistente?: number) => void;
  cambiarEstadoGuia: (idGuia: number, nuevoEstado: EstadoGuia) => boolean;
  restablecerDatosSemilla: () => void;
  buscarOProgramarViajes: (origen: string, destino: string, fecha: string) => ViajeProgramado[];
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useLocalStorage<Cliente[]>('copetran.clientes', clientesSeed);
  const [viajes, setViajes] = useLocalStorage<ViajeProgramado[]>('copetran.viajes_v3', viajesProgramadosSeed);
  const [tiquetes, setTiquetes] = useLocalStorage<Tiquete[]>('copetran.tiquetes', tiquetesSeed);
  const [facturas, setFacturas] = useLocalStorage<Factura[]>('copetran.facturas', facturasSeed);
  const [guias, setGuias] = useLocalStorage<GuiaEnvio[]>('copetran.guias', guiasSeed);
  const [remesas, setRemesas] = useLocalStorage<Remesa[]>('copetran.remesas', remesasSeed);

  const sillasDelViaje = useCallback(
    (idViaje: number): SillaConEstado[] => {
      const viaje = viajes.find((v) => v.id_viaje === idViaje);
      if (!viaje) return [];
      const todasLasSillas = sillasPorBus[viaje.id_bus] ?? generarSillas(viaje.id_bus);
      const ocupadas = new Set(
        tiquetes
          .filter(
            (t) =>
              t.id_viaje === idViaje &&
              (t.id_estado_tiquete === 'RESERVADO' ||
                t.id_estado_tiquete === 'PAGADO' ||
                t.id_estado_tiquete === 'ABIERTO'),
          )
          .map((t) => t.id_silla),
      );
      return todasLasSillas.map((s) => ({ ...s, ocupada: ocupadas.has(s.id_silla) }));
    },
    [viajes, tiquetes],
  );

  const sillasDisponibles = useCallback(
    (idViaje: number): Silla[] => sillasDelViaje(idViaje).filter((s) => !s.ocupada),
    [sillasDelViaje],
  );

  const registrarCliente = useCallback(
    (datos: Omit<Cliente, 'id_cliente'>): Cliente => {
      const existente = clientes.find((c) => c.documento === datos.documento);
      if (existente) return existente;
      const nuevo: Cliente = { id_cliente: Date.now(), ...datos };
      setClientes((prev) => [...prev, nuevo]);
      return nuevo;
    },
    [clientes, setClientes],
  );

  const venderTiquete = useCallback(
    (params: VenderTiqueteParams): Tiquete => {
      const { idViaje, idSilla, idPasajero, idCajero, idCanalVenta, idMetodoPago, tipoTiquete } = params;
      const descuentoPorcentaje = Math.min(100, Math.max(0, params.descuentoPorcentaje ?? 0));

      // RF03: un tiquete por silla por viaje (UNIQUE(id_viaje, id_silla)).
      const disponibles = sillasDisponibles(idViaje);
      if (!disponibles.some((s) => s.id_silla === idSilla)) {
        throw new Error('La silla ya no está disponible para este viaje.');
      }

      const valorConDescuento = Math.round(VALOR_TIQUETE_BASE * (1 - descuentoPorcentaje / 100));

      const idFactura = Math.max(0, ...facturas.map((f) => f.id_factura)) + 1;
      // Nota (hallazgo Sección 14.6 del brief): TIQUETE.id_factura es NOT NULL
      // en el schema real aunque exista el estado RESERVADO (reserva sin pago).
      // Este mock reproduce esa contradicción documentada: para RESERVADO se
      // genera igualmente una factura, pero con monto_total en 0 (pendiente).
      const factura: Factura = {
        id_factura: idFactura,
        id_cliente: idPasajero,
        id_cajero: idCajero,
        id_metodo_pago: idMetodoPago,
        fecha_emision: new Date().toISOString(),
        monto_total: tipoTiquete === 'RESERVADO' ? 0 : valorConDescuento,
        cufe: tipoTiquete === 'RESERVADO' ? undefined : `CUFE-DEMO-${String(idFactura).padStart(4, '0')}`,
      };

      // RF03: bloqueo temporal de silla (demo: 3 minutos, como sugiere el brief).
      // Penalidad y fecha límite de tiquete ABIERTO: el brief (ECU-01) exige
      // que existan como campos parametrizables, pero no fija un valor exacto
      // — aquí se usa un valor de demostración (30 días, $15.000) hasta que
      // el equipo lo defina como regla de negocio real.
      const idTiquete = Math.max(0, ...tiquetes.map((t) => t.id_tiquete)) + 1;
      const nuevoTiquete: Tiquete = {
        id_tiquete: idTiquete,
        numero_tiquete: `TQ-${String(idTiquete).padStart(6, '0')}`,
        id_viaje: idViaje,
        id_silla: idSilla,
        id_pasajero: idPasajero,
        id_factura: idFactura,
        id_canal_venta: idCanalVenta,
        id_estado_tiquete: tipoTiquete,
        valor_pagado: factura.monto_total,
        penalidad_reprogramacion: tipoTiquete === 'ABIERTO' ? 15000 : 0,
        fecha_expiracion_reserva:
          tipoTiquete === 'RESERVADO' ? new Date(Date.now() + 3 * 60 * 1000).toISOString() : undefined,
        fecha_limite_abierto:
          tipoTiquete === 'ABIERTO'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : undefined,
      };

      setFacturas((prev) => [...prev, factura]);
      setTiquetes((prev) => [...prev, nuevoTiquete]);
      return nuevoTiquete;
    },
    [facturas, tiquetes, sillasDisponibles, setFacturas, setTiquetes],
  );

  const cambiarEstadoTiquete = useCallback(
    (idTiquete: number, nuevoEstado: EstadoTiquete): boolean => {
      const tiquete = tiquetes.find((t) => t.id_tiquete === idTiquete);
      if (!tiquete) return false;
      const permitidas = TRANSICIONES_TIQUETE[tiquete.id_estado_tiquete];
      if (!permitidas.includes(nuevoEstado)) return false;
      setTiquetes((prev) =>
        prev.map((t) => (t.id_tiquete === idTiquete ? { ...t, id_estado_tiquete: nuevoEstado } : t)),
      );
      return true;
    },
    [tiquetes, setTiquetes],
  );

  const admitirGuia = useCallback(
    (params: AdmitirGuiaParams): GuiaEnvio => {
      const { idRemitente, idDestinatario, categoria, pesoKg, idCajero, idMetodoPago, pagaInmediato } = params;
      const valorTotal = Math.round(pesoKg * TARIFA_POR_KG[categoria]);

      let idFactura: number | undefined;
      if (pagaInmediato) {
        idFactura = Math.max(0, ...facturas.map((f) => f.id_factura)) + 1;
        const factura: Factura = {
          id_factura: idFactura,
          id_cliente: idRemitente,
          id_cajero: idCajero,
          id_metodo_pago: idMetodoPago,
          fecha_emision: new Date().toISOString(),
          monto_total: valorTotal,
          cufe: `CUFE-DEMO-${String(idFactura).padStart(4, '0')}`,
        };
        setFacturas((prev) => [...prev, factura]);
      }

      const idGuia = Math.max(0, ...guias.map((g) => g.id_guia)) + 1;
      const nuevaGuia: GuiaEnvio = {
        id_guia: idGuia,
        codigo_barras: `GU-${String(idGuia).padStart(8, '0')}`,
        id_remitente: idRemitente,
        id_destinatario: idDestinatario,
        id_factura: idFactura,
        id_categoria_mercancia: categoria,
        id_estado_guia: 'ADMITIDO',
        peso_kg: pesoKg,
        valor_total: valorTotal,
        fecha_admision: new Date().toISOString(),
      };

      setGuias((prev) => [...prev, nuevaGuia]);
      return nuevaGuia;
    },
    [facturas, guias, setFacturas, setGuias],
  );

  const consolidarEnRemesa = useCallback(
    (idGuia: number, idRemesaExistente?: number) => {
      const guia = guias.find((g) => g.id_guia === idGuia);
      if (!guia) return;

      if (idRemesaExistente) {
        // Equivalente a RemesaDAO.recalcularTotales() del diagrama de clases DAO (RF17).
        setRemesas((prev) =>
          prev.map((r) =>
            r.id_remesa === idRemesaExistente
              ? {
                  ...r,
                  peso_total: r.peso_total + guia.peso_kg,
                  monto_total: r.monto_total + (guia.valor_total ?? 0),
                  bultos_cantidad: r.bultos_cantidad + 1,
                }
              : r,
          ),
        );
        setGuias((prev) => prev.map((g) => (g.id_guia === idGuia ? { ...g, id_remesa: idRemesaExistente } : g)));
        return;
      }

      const idRemesa = Math.max(0, ...remesas.map((r) => r.id_remesa)) + 1;
      const nuevaRemesa: Remesa = {
        id_remesa: idRemesa,
        numero_remesa: `RM-${String(idRemesa).padStart(6, '0')}`,
        id_remitente: guia.id_remitente,
        id_destinatario: guia.id_destinatario,
        fecha_creacion: new Date().toISOString(),
        peso_total: guia.peso_kg,
        bultos_cantidad: 1,
        monto_total: guia.valor_total ?? 0,
      };
      setRemesas((prev) => [...prev, nuevaRemesa]);
      setGuias((prev) => prev.map((g) => (g.id_guia === idGuia ? { ...g, id_remesa: idRemesa } : g)));
    },
    [guias, remesas, setGuias, setRemesas],
  );

  const cambiarEstadoGuia = useCallback(
    (idGuia: number, nuevoEstado: EstadoGuia): boolean => {
      const guia = guias.find((g) => g.id_guia === idGuia);
      if (!guia) return false;
      const permitidas = TRANSICIONES_GUIA[guia.id_estado_guia];
      if (!permitidas.includes(nuevoEstado)) return false;
      setGuias((prev) =>
        prev.map((g) =>
          g.id_guia === idGuia
            ? { ...g, id_estado_guia: nuevoEstado, fecha_entrega: nuevoEstado === 'ENTREGADO' ? new Date().toISOString() : g.fecha_entrega }
            : g,
        ),
      );
      return true;
    },
    [guias, setGuias],
  );

  const buscarOProgramarViajes = useCallback(
    (origen: string, destino: string, fecha: string): ViajeProgramado[] => {
      const origLower = origen.trim().toLowerCase();
      const destLower = destino.trim().toLowerCase();
      if (!origLower || !destLower || origLower === destLower) return [];

      // 1. Buscar si ya existen viajes en esa fecha exacta
      const directos = viajes.filter(
        (v) =>
          v.origen_ciudad.toLowerCase() === origLower &&
          v.destino_ciudad.toLowerCase() === destLower &&
          v.fecha === fecha,
      );
      if (directos.length > 0) return directos;

      // 2. Si existen viajes de esa ruta en otras fechas, adaptar sus horarios para la fecha solicitada
      const viajesRuta = viajes.filter(
        (v) =>
          v.origen_ciudad.toLowerCase() === origLower &&
          v.destino_ciudad.toLowerCase() === destLower,
      );

      const maxId = Math.max(0, ...viajes.map((v) => v.id_viaje));

      if (viajesRuta.length > 0) {
        // Obtener horarios únicos de esa ruta
        const horariosVistos = new Set<string>();
        const salidasRuta = viajesRuta.filter((v) => {
          if (horariosVistos.has(v.hora_salida)) return false;
          horariosVistos.add(v.hora_salida);
          return true;
        });

        const nuevosViajes: ViajeProgramado[] = salidasRuta.map((base, idx) => ({
          ...base,
          id_viaje: maxId + idx + 1,
          fecha: fecha,
          estado_viaje: 'PROGRAMADO',
        }));

        setViajes((prev) => [...prev, ...nuevosViajes]);
        return nuevosViajes;
      }

      // 3. Si es cualquier otra combinación intermunicipal válida de Copetran que no tenía registros,
      // generamos automáticamente los itinerarios diarios oficiales de Copetran para esa fecha:
      const horariosDefault = [
        { hora: '07:30', bus: 3, placa: 'WRT-789', cond: 12 },
        { hora: '14:30', bus: 4, placa: 'WRT-501', cond: 14 },
        { hora: '20:30', bus: 5, placa: 'WRT-302', cond: 15 },
      ];

      const nuevosViajesGenerados: ViajeProgramado[] = horariosDefault.map((h, idx) => ({
        id_viaje: maxId + idx + 1,
        id_itinerario: 80 + idx,
        id_bus: h.bus,
        id_conductor: h.cond,
        fecha: fecha,
        hora_salida: h.hora,
        estado_viaje: 'PROGRAMADO',
        origen_ciudad: origen,
        destino_ciudad: destino,
        placa_bus: h.placa,
      }));

      setViajes((prev) => [...prev, ...nuevosViajesGenerados]);
      return nuevosViajesGenerados;
    },
    [viajes, setViajes],
  );

  const restablecerDatosSemilla = useCallback(() => {
    setClientes(clientesSeed);
    setViajes(viajesProgramadosSeed);
    setTiquetes(tiquetesSeed);
    setFacturas(facturasSeed);
    setGuias(guiasSeed);
    setRemesas(remesasSeed);
  }, [setClientes, setViajes, setTiquetes, setFacturas, setGuias, setRemesas]);

  const value = useMemo<DataContextValue>(
    () => ({
      clientes,
      viajes,
      tiquetes,
      facturas,
      guias,
      remesas,
      sillasDisponibles,
      sillasDelViaje,
      registrarCliente,
      venderTiquete,
      cambiarEstadoTiquete,
      admitirGuia,
      consolidarEnRemesa,
      cambiarEstadoGuia,
      restablecerDatosSemilla,
      buscarOProgramarViajes,
    }),
    [
      clientes,
      viajes,
      tiquetes,
      facturas,
      guias,
      remesas,
      sillasDisponibles,
      sillasDelViaje,
      registrarCliente,
      venderTiquete,
      cambiarEstadoTiquete,
      admitirGuia,
      consolidarEnRemesa,
      cambiarEstadoGuia,
      restablecerDatosSemilla,
      buscarOProgramarViajes,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de un <DataProvider>');
  return ctx;
}
