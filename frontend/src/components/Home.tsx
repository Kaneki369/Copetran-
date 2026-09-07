import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bus,
  Package,
  ShieldCheck,
  Clock,
  Wifi,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeftRight,
  Search,
  Users,
  PhoneCall,
  CheckCircle2,
  LogIn,
  Sparkles,
  Navigation,
  ChevronRight,
  Star,
  Award,
  Truck,
  Tv,
  Zap,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

const CIUDADES_COPETRAN = [
  { id: 'Bucaramanga', nombre: 'Bucaramanga (Sede Principal)' },
  { id: 'Bogotá', nombre: 'Bogotá D.C. (Terminal Salitre)' },
  { id: 'Medellín', nombre: 'Medellín (Terminal del Norte)' },
  { id: 'Cúcuta', nombre: 'Cúcuta (Terminal Central)' },
  { id: 'Santa Marta', nombre: 'Santa Marta (Terminal Rodoviario)' },
  { id: 'Cartagena', nombre: 'Cartagena (Terminal de Transportes)' },
];

export function Home() {
  const navigate = useNavigate();
  const { usuario, login } = useAuth();
  const { guias, buscarOProgramarViajes } = useData();

  // Fecha mínima permitida (día actual en formato YYYY-MM-DD en hora local)
  const fechaHoy = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  // Estado del widget de búsqueda del Hero
  const [activeTab, setActiveTab] = useState<'pasajes' | 'mensajeria'>('pasajes');
  const [origen, setOrigen] = useState('Bucaramanga');
  const [destino, setDestino] = useState('Bogotá');
  const [fechaViaje, setFechaViaje] = useState(fechaHoy);
  const [numGuiaBuscar, setNumGuiaBuscar] = useState('');
  const [guiaResultado, setGuiaResultado] = useState<typeof guias[0] | null | 'no_encontrada'>(null);
  const [viajesFiltrados, setViajesFiltrados] = useState<ReturnType<typeof buscarOProgramarViajes> | null>(null);

  // Cambio de origen con ajuste automático de destino para evitar origen === destino
  function handleCambiarOrigen(nuevoOrigen: string) {
    setOrigen(nuevoOrigen);
    if (destino === nuevoOrigen) {
      const alternativa = CIUDADES_COPETRAN.find((c) => c.id !== nuevoOrigen)?.id ?? 'Bogotá';
      setDestino(alternativa);
    }
  }

  // Intercambiar ciudades (origen <-> destino)
  function handleIntercambiarCiudades() {
    const temp = origen;
    setOrigen(destino);
    setDestino(temp);
  }

  // Buscar viajes disponibles
  function handleBuscarViajes(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (origen === destino) {
      setViajesFiltrados([]);
      return;
    }
    const fechaAUsar = fechaViaje < fechaHoy ? fechaHoy : fechaViaje;
    if (fechaViaje < fechaHoy) {
      setFechaViaje(fechaHoy);
    }
    const resultados = buscarOProgramarViajes(origen, destino, fechaAUsar);
    setViajesFiltrados(resultados);
  }

  // Rastrear encomienda
  function handleRastrearGuia(e: React.FormEvent) {
    e.preventDefault();
    if (!numGuiaBuscar.trim()) return;
    const busqueda = numGuiaBuscar.trim().toUpperCase();
    const encontrada = guias.find(
      (g) =>
        g.id_guia.toString() === busqueda ||
        `GUIA-${g.id_guia}` === busqueda ||
        `ENVIO-${g.id_guia}` === busqueda,
    );
    if (encontrada) {
      setGuiaResultado(encontrada);
    } else {
      setGuiaResultado('no_encontrada');
    }
  }

  // Comprar tiquete rápido: asigna sesión de Cliente y abre el módulo de compra con el viaje preseleccionado
  function handleComprarTiquete(idViaje?: number) {
    if (!usuario) {
      login({ nombre: 'Laura Gómez Rey', rol: 'CLIENTE' });
    }
    try {
      const guardado = window.localStorage.getItem('copetran.clienteActual');
      if (!guardado) {
        window.localStorage.setItem(
          'copetran.clienteActual',
          JSON.stringify({
            id_cliente: 1,
            documento: '1098765432',
            nombres: 'Laura',
            apellidos: 'Gómez Rey',
            celular: '3011234567',
          }),
        );
      }
    } catch {
      // ignore
    }

    if (idViaje) {
      navigate(`/dashboard?tab=tiquetes&viaje=${idViaje}`);
    } else {
      navigate('/dashboard?tab=tiquetes');
    }
  }

  // Seleccionar ruta popular directamente
  function handleSeleccionarRutaRapida(orig: string, dest: string) {
    setOrigen(orig);
    setDestino(dest);
    const resultados = buscarOProgramarViajes(orig, dest, fechaViaje);
    setViajesFiltrados(resultados);
    const widget = document.getElementById('widget-reserva');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const rutasDestacadas = [
    {
      origen: 'Bucaramanga',
      destino: 'Bogotá',
      tiempo: '8h 30m',
      frecuencia: 'Salidas cada 2 horas',
      precio: 85000,
      tipo: 'Doble Piso Preferencial',
      popular: true,
    },
    {
      origen: 'Bogotá',
      destino: 'Medellín',
      tiempo: '9h 15m',
      frecuencia: 'Salidas mañana y tarde',
      precio: 90000,
      tipo: 'Bus Cama Confort',
      popular: true,
    },
    {
      origen: 'Bucaramanga',
      destino: 'Medellín',
      tiempo: '7h 45m',
      frecuencia: '6 salidas diarias',
      precio: 95000,
      tipo: 'Bus Cama Confort',
      popular: true,
    },
    {
      origen: 'Bucaramanga',
      destino: 'Santa Marta',
      tiempo: '10h 30m',
      frecuencia: 'Salidas nocturnas y diurnas',
      precio: 125000,
      tipo: 'Doble Piso VIP',
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* ------------------------------------------------------------- */}
      {/* NAVBAR SUPERIOR FIJO */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y Slogan */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-11 w-11 rounded-xl bg-copetran-600 p-0.5 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition overflow-hidden">
                  <img
                    src="/assets/copetran-square.png"
                    alt="Copetran"
                    className="h-full w-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-wider text-white flex items-center gap-1">
                    COPETRAN
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  </span>
                  <p className="text-[10px] uppercase font-semibold tracking-widest text-amber-400">
                    La Fuerza Que Mueve a Colombia
                  </p>
                </div>
              </Link>
            </div>

            {/* Enlaces de navegación desktop */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#pasajes" className="hover:text-amber-400 transition">
                Pasajes
              </a>
              <a href="#mensajeria" className="hover:text-amber-400 transition">
                Envíos & Carga
              </a>
              <a href="#rutas" className="hover:text-amber-400 transition">
                Rutas Populares
              </a>
              <a href="#beneficios" className="hover:text-amber-400 transition">
                Por Qué Elegirnos
              </a>
              <a href="#flota" className="hover:text-amber-400 transition">
                Flota
              </a>
              <a href="#contacto" className="hover:text-amber-400 transition">
                Contacto
              </a>
            </nav>

            {/* BOTÓN EN LA ESQUINA SUPERIOR DERECHA: INICIO DE SESIÓN / ACCESO AL SISTEMA */}
            <div className="flex items-center gap-3">
              {usuario ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                    Hola, <strong className="text-white">{usuario.nombre}</strong> ({usuario.rol})
                  </span>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-copetran-600 to-blue-700 hover:from-copetran-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-blue-500/25 transition"
                  >
                    Workspace
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <LogIn className="h-4 w-4 text-slate-900 group-hover:rotate-12 transition-transform" />
                  <span>Acceso al Sistema</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION CON WIDGET DE RESERVA INTERACTIVO */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 text-white pt-12 pb-24 sm:pt-16 sm:pb-32">
        {/* Luces de fondo y patrones */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-[400px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-inner">
              <Award className="h-4 w-4" />
              Más de 80 años uniendo a las familias colombianas
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Viaja seguro, cómodo y{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                siempre a tiempo
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              La empresa insignia de transporte intermunicipal, paquetería y carga en Colombia.
              Reserva tus pasajes en línea y haz seguimiento de tus envíos con total tranquilidad.
            </p>
          </div>

          {/* WIDGET INTERACTIVO DE BÚSQUEDA Y RASTREO */}
          <div id="widget-reserva" className="max-w-4xl mx-auto bg-white text-slate-900 rounded-3xl shadow-2xl shadow-blue-950/50 border border-slate-100 overflow-hidden">
            {/* Pestañas superiores */}
            <div className="flex border-b border-slate-200 bg-slate-50/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pasajes');
                  setGuiaResultado(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2.5 py-4 px-6 text-sm font-bold transition border-b-2',
                  activeTab === 'pasajes'
                    ? 'border-copetran-600 text-copetran-600 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/70',
                )}
              >
                <Bus className="h-5 w-5 text-copetran-600" />
                <span>Comprar Tiquetes de Pasajeros</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mensajeria');
                  setViajesFiltrados(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2.5 py-4 px-6 text-sm font-bold transition border-b-2',
                  activeTab === 'mensajeria'
                    ? 'border-copetran-600 text-copetran-600 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/70',
                )}
              >
                <Package className="h-5 w-5 text-copetran-600" />
                <span>Rastrear Encomienda o Guía</span>
              </button>
            </div>

            {/* Contenido pestaña: COMPRAR PASAJES */}
            {activeTab === 'pasajes' && (
              <div className="p-6 sm:p-8">
                <form onSubmit={handleBuscarViajes} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                  {/* Origen */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-copetran-600" />
                      Origen
                    </label>
                    <select
                      value={origen}
                      onChange={(e) => handleCambiarOrigen(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-copetran-500 focus:ring-2 focus:ring-copetran-100 outline-none transition"
                    >
                      {CIUDADES_COPETRAN.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botón intercambio de ciudades */}
                  <div className="flex items-center justify-center lg:col-span-1 pb-1">
                    <button
                      type="button"
                      onClick={handleIntercambiarCiudades}
                      title="Intercambiar origen y destino"
                      className="h-[42px] w-full lg:w-[42px] rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200 flex items-center justify-center shadow-sm transition hover:scale-105 active:scale-95 gap-1.5 text-xs font-semibold"
                    >
                      <ArrowLeftRight className="h-4 w-4 shrink-0 text-copetran-600" />
                      <span className="lg:hidden">Invertir</span>
                    </button>
                  </div>

                  {/* Destino (excluye origen actual) */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-amber-500" />
                      Destino
                    </label>
                    <select
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-copetran-500 focus:ring-2 focus:ring-copetran-100 outline-none transition"
                    >
                      {CIUDADES_COPETRAN.filter((c) => c.id !== origen).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha de Viaje */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-copetran-600" />
                      Fecha de salida
                    </label>
                    <input
                      type="date"
                      min={fechaHoy}
                      value={fechaViaje}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val || val >= fechaHoy) {
                          setFechaViaje(val || fechaHoy);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-copetran-500 focus:ring-2 focus:ring-copetran-100 outline-none transition"
                    />
                  </div>

                  {/* Botón Buscar */}
                  <div className="lg:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-[42px] rounded-xl bg-copetran-600 hover:bg-copetran-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
                    >
                      <Search className="h-4 w-4" />
                      Buscar Salidas
                    </button>
                  </div>
                </form>

                {/* Resultados de viajes si se buscaron */}
                {viajesFiltrados !== null && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-800">
                        Viajes disponibles encontrados ({viajesFiltrados.length})
                      </h4>
                      <span className="text-xs text-slate-500">Tarifa base desde $85.000 COP</span>
                    </div>

                    {viajesFiltrados.length === 0 ? (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>
                          No encontramos viajes exactos para esa combinación en este momento. Sin embargo, hay
                          salidas diarias disponibles en taquillas y en el módulo de ventas.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {viajesFiltrados.map((v) => (
                          <div
                            key={v.id_viaje}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-copetran-400 bg-slate-50/50 hover:bg-white transition gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-copetran-100 text-copetran-700 flex items-center justify-center font-bold">
                                <Bus className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {v.origen_ciudad} → {v.destino_ciudad}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Salida: <strong>{v.hora_salida} hrs</strong> • Bus: {v.placa_bus} • Fecha:{' '}
                                  {formatDate(v.fecha)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right">
                                <span className="text-xs text-slate-500 block">Tarifa por pasajero</span>
                                <span className="text-base font-extrabold text-copetran-600">
                                  {formatCurrency(85000)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleComprarTiquete(v.id_viaje)}
                                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider transition shadow-sm"
                              >
                                Seleccionar Silla
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contenido pestaña: RASTREAR GUÍA */}
            {activeTab === 'mensajeria' && (
              <div className="p-6 sm:p-8">
                <form onSubmit={handleRastrearGuia} className="max-w-xl mx-auto">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Número de Guía o Código de Rastreo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={numGuiaBuscar}
                      onChange={(e) => setNumGuiaBuscar(e.target.value)}
                      placeholder="Ej: GUIA-1 o 1, 2, 3..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-copetran-500 focus:ring-2 focus:ring-copetran-100 outline-none transition"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-copetran-600 hover:bg-copetran-700 text-white font-bold text-sm px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition"
                    >
                      <Search className="h-4 w-4" />
                      Rastrear
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Ingresa el número impreso en tu recibo de admisión para conocer la ubicación de tu paquete.
                  </p>
                </form>

                {/* Resultado de búsqueda de guía */}
                {guiaResultado === 'no_encontrada' && (
                  <div className="mt-6 max-w-xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <Info className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      No encontramos ninguna guía con el código <strong>"{numGuiaBuscar}"</strong>. Verifica que el
                      número sea correcto o comunícate con nuestro centro de atención.
                    </span>
                  </div>
                )}

                {guiaResultado && guiaResultado !== 'no_encontrada' && (
                  <div className="mt-6 max-w-xl mx-auto p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-500">Guía Encontrada</span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          GUIA-ENVIO #{guiaResultado.id_guia}
                        </h4>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full uppercase">
                        {guiaResultado.id_estado_guia}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Categoría:</span>
                        <strong className="text-slate-800">{guiaResultado.id_categoria_mercancia}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Peso Registrado:</span>
                        <strong className="text-slate-800">{guiaResultado.peso_kg} Kg</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Valor Flete:</span>
                        <strong className="text-slate-800">
                          {formatCurrency(guiaResultado.valor_total ?? 0)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Remesa Asignada:</span>
                        <strong className="text-slate-800">
                          {guiaResultado.id_remesa ? `#${guiaResultado.id_remesa}` : 'Sin consolidar aún'}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="text-xs font-bold text-copetran-600 hover:text-copetran-700 flex items-center gap-1"
                      >
                        Ver trazabilidad completa en el sistema →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BARRA DE CIFRAS Y SOCIAL PROOF */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-y border-slate-200 py-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-copetran-600">+80</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                Años de Trayectoria
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-copetran-600">+100</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                Destinos y Agencias
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-copetran-600">3.5M</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                Pasajeros Conectados/Año
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-copetran-600">99.8%</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                Entregas a Tiempo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* RUTAS POPULARES & PRECIOS */}
      {/* ------------------------------------------------------------- */}
      <section id="rutas" className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-copetran-600 uppercase tracking-widest block mb-2">
                Destinos Más Solicitados
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Rutas Populares en Colombia
              </h2>
              <p className="text-slate-600 mt-2 text-sm max-w-xl">
                Descubre los trayectos más concurridos con los mejores horarios, precios especiales y la mayor
                frecuencia de salida del país.
              </p>
            </div>
            <button
              onClick={() => handleComprarTiquete()}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold text-copetran-600 hover:text-copetran-700 transition"
            >
              Ver todas las rutas y horarios <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rutasDestacadas.map((ruta, idx) => (
              <div
                key={idx}
                className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-slate-200 hover:border-copetran-400 transition-all duration-300 flex flex-col justify-between"
              >
                {ruta.popular && (
                  <span className="absolute top-4 right-4 bg-amber-400/90 text-slate-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    Muy Solicitada
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3">
                    <Clock className="h-3.5 w-3.5 text-copetran-600" />
                    <span>{ruta.tiempo} aprox.</span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 group-hover:text-copetran-600 transition">
                    {ruta.origen} → {ruta.destino}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">{ruta.frecuencia}</p>

                  <div className="mt-4 inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                    {ruta.tipo}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Desde</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(ruta.precio)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSeleccionarRutaRapida(ruta.origen, ruta.destino)}
                    className="p-2.5 rounded-xl bg-copetran-50 hover:bg-copetran-600 text-copetran-600 hover:text-white transition-colors"
                    title="Consultar y reservar esta ruta"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* NUESTRAS LÍNEAS DE SERVICIO (PASAJEROS Y CARGA) */}
      {/* ------------------------------------------------------------- */}
      <section id="pasajes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-copetran-600 uppercase tracking-widest block mb-2">
              Soluciones Integrales
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Líneas de Negocio Diseñadas para Ti
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Desde el viaje más placentero por carretera hasta la logística de paquetería más confiable para tu
              hogar o empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tarjeta 1: Pasajeros */}
            <div className="rounded-3xl p-8 bg-gradient-to-b from-slate-50 to-blue-50/50 border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-copetran-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-600/30">
                <Bus className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Transporte de Pasajeros</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Flota moderna con buses Doble Piso y Servicio Preferencial. Disfruta de sillas tipo poltrona, aire
                acondicionado, conectores USB y pantallas individuales.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Sillas ergonómicas reclinables 160°
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Conexión Wi-Fi a bordo y cargadores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Control de abordaje y tiquete digital
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleComprarTiquete()}
                className="w-full py-2.5 rounded-xl bg-copetran-600 hover:bg-copetran-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Comprar Tiquete
              </button>
            </div>

            {/* Tarjeta 2: Mensajería Expresa */}
            <div id="mensajeria" className="rounded-3xl p-8 bg-gradient-to-b from-slate-50 to-amber-50/50 border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mb-6 shadow-md shadow-amber-500/30">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Mensajería y Encomiendas</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Recepción, pesaje, admisión y entrega oportuna de paquetes, documentos y mercancías con código de
                barras y trazabilidad en tiempo real.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Tarifas transparentes por peso y volumen
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Clasificación de mercancía delicada o perecedera
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Rastreo en línea por número de guía
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mensajeria');
                  window.scrollTo({ top: 150, behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
              >
                Rastrear Mi Paquete
              </button>
            </div>

            {/* Tarjeta 3: Carga Masiva y Remesas */}
            <div className="rounded-3xl p-8 bg-gradient-to-b from-slate-50 to-emerald-50/50 border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-md shadow-slate-900/30">
                <Truck className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Carga Masiva y Logística</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Consolidación de remesas y despacho de fletes industriales entre las principales zonas francas,
                puertos y ciudades capitales de Colombia.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Vehículos dedicados con monitoreo GPS 24/7
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Pólizas de seguro de carga integral
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Atención corporativa personalizada
                </li>
              </ul>
              <a
                href="#contacto"
                className="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Cotizar Carga Corporativa
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BENEFICIOS / POR QUÉ COPETRAN */}
      {/* ------------------------------------------------------------- */}
      <section id="beneficios" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
              Seguridad y Confianza
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ¿Por qué viajar y enviar con Copetran?
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              Nos enfocamos en brindar los más altos estándares de servicio en carretera y tecnología operativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition">
              <div className="h-12 w-12 rounded-xl bg-copetran-600/30 text-copetran-400 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Seguridad 24/7 en Ruta</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Control satelital permanente de velocidad y paradas, con revisiones técnicas preoperacionales y
                pruebas a conductores antes de cada despacho.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition">
              <div className="h-12 w-12 rounded-xl bg-copetran-600/30 text-copetran-400 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Máximo Confort</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sillas tipo poltrona con espacio para piernas superior al estándar, aire climatizado y baños
                constantemente higienizados.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition">
              <div className="h-12 w-12 rounded-xl bg-copetran-600/30 text-copetran-400 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Puntualidad Garantizada</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Itinerarios de salida programados y despachos coordinados para que llegues a tiempo a tu destino de
                trabajo o descanso.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition">
              <div className="h-12 w-12 rounded-xl bg-copetran-600/30 text-copetran-400 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Compra Digital Fácil</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Elige tu asiento en el mapa interactivo de sillas, paga con tarjeta, PSE o efectivo en taquilla y
                recibe tu tiquete con código QR al instante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* NUESTRA FLOTA (EQUIPAMIENTO ONBOARD) */}
      {/* ------------------------------------------------------------- */}
      <section id="flota" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-copetran-700 via-copetran-600 to-blue-700 rounded-3xl text-white p-8 sm:p-14 shadow-2xl overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
              <Bus className="h-96 w-96 text-white" />
            </div>

            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
                Experiencia a Bordo
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Buses Doble Piso de Última Generación
              </h2>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed mb-8">
                Nuestros vehículos cuentan con carrocerías de estándar internacional, equipados con suspensión
                neumática que suaviza el trayecto y tecnología de entretenimiento a bordo.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
                  <Wifi className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs font-bold block">Wi-Fi Gratis</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
                  <Tv className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs font-bold block">Pantallas HD</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs font-bold block">Tomas USB</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
                  <Users className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs font-bold block">Sillas Cama</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleComprarTiquete()}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
              >
                Comprar Tiquete en Bus Doble Piso
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* TESTIMONIOS DE VIAJEROS */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-copetran-600 uppercase tracking-widest block mb-2">
              Opiniones Reales
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Lo que dicen nuestros clientes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 text-xs sm:text-sm italic leading-relaxed">
                "Viajo mensualmente entre Bucaramanga y Bogotá por trabajo. El servicio Doble Piso es súper cómodo,
                las sillas se reclinan bastante bien y el wifi me permitió trabajar sin problemas."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-copetran-100 text-copetran-700 font-bold flex items-center justify-center text-xs">
                  CR
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Carlos Ramírez</h5>
                  <p className="text-[11px] text-slate-400">Pasajero Frecuente</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 text-xs sm:text-sm italic leading-relaxed">
                "Envié una encomienda urgente de documentos desde Cúcuta a Medellín. Llegó intacta y antes de lo
                esperado. El rastreo de la guía en el portal fue muy exacto."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                  MP
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Mariana Peña</h5>
                  <p className="text-[11px] text-slate-400">Cliente de Paquetería</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 text-xs sm:text-sm italic leading-relaxed">
                "Nos fuimos de vacaciones familiares a Santa Marta en Copetran. El viaje nocturno fue silencioso, muy
                seguro y los conductores fueron muy amables. Totalmente recomendados."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                  JA
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Jorge Ardila</h5>
                  <p className="text-[11px] text-slate-400">Viajero Vacacional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BANNER INVITACIÓN Y CTA FINAL */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            ¿Listo para tu próximo destino o envío?
          </h2>
          <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
            Únete a los millones de colombianos que confían cada día en la flota más confiable y moderna del país.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleComprarTiquete()}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
            >
              Comprar Tiquete en Línea
            </button>
            <Link
              to="/login"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Acceso a Taquillas y Operaciones
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER INSTITUCIONAL */}
      {/* ------------------------------------------------------------- */}
      <footer id="contacto" className="bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Columna 1: Datos de Empresa */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-9 w-9 rounded-xl bg-copetran-600 p-0.5 flex items-center justify-center overflow-hidden">
                  <img
                    src="/assets/copetran-square.png"
                    alt="Copetran"
                    className="h-full w-full object-cover rounded-lg"
                  />
                </div>
                <span className="text-lg font-black text-white">COPETRAN</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px] mb-4">
                Cooperativa Santandereana de Transportadores. Conectando caminos, personas y mercancías con calidad,
                seguridad y calidez humana.
              </p>
              <p className="text-amber-400 font-bold text-[11px]">Sede Principal: Bucaramanga, Santander</p>
            </div>

            {/* Columna 2: Servicios */}
            <div>
              <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-3">Servicios</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#pasajes" className="hover:text-amber-400 transition">
                    Transporte de Pasajeros
                  </a>
                </li>
                <li>
                  <a href="#mensajeria" className="hover:text-amber-400 transition">
                    Mensajería Expresa & Paquetería
                  </a>
                </li>
                <li>
                  <a href="#mensajeria" className="hover:text-amber-400 transition">
                    Carga Masiva y Semimasiva
                  </a>
                </li>
                <li>
                  <a href="#flota" className="hover:text-amber-400 transition">
                    Flota Doble Piso y Preferencial
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3: Atención al Viajero */}
            <div>
              <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-3">Atención al Cliente</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                  <span>Línea Gratuita: 01 8000 114 114</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WhatsApp: +57 311 234 5678</span>
                </li>
                <li>Terminales de Transporte a Nivel Nacional</li>
                <li>Horario: Atención 24 Horas</li>
              </ul>
            </div>

            {/* Columna 4: Portal del Personal */}
            <div>
              <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-3">
                Portal Corporativo
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                Acceso exclusivo para cajeros de taquilla, auxiliares de despacho y operarios de bodega.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold transition"
              >
                <LogIn className="h-4 w-4" />
                Ingresar a Taquillas y Operaciones →
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Copetran. Todos los derechos reservados.</p>
            <p className="text-center sm:text-right">
              Patrones de Diseño de Software • Universidad Sergio Arboleda
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
