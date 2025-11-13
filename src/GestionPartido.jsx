import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

export default function GestionPartido() {
  const [jugadores, setJugadores] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoDorsal, setNuevoDorsal] = useState("");
  const [tiempo, setTiempo] = useState(0);
  const [enMarcha, setEnMarcha] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [dorsalEditado, setDorsalEditado] = useState("");
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);

  useEffect(() => {
    if (!enMarcha) return;
    const intervalo = setInterval(() => {
      setTiempo((prev) => {
        if (prev >= 99 * 60) {
          setEnMarcha(false);
          setFinalizado(true);
          return prev;
        }
        return prev + 1;
      });
      setJugadores((prev) =>
        prev.map((p) =>
          p.enCancha && tiempo < 99 * 60
            ? { ...p, segundos: (p.segundos || 0) + 1 }
            : p
        )
      );
    }, 1000);
    return () => clearInterval(intervalo);
  }, [enMarcha, tiempo]);

  const formatearTiempo = (segundos = 0) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${Math.min(min, 99)}m ${String(seg).padStart(2, "0")}s`;
  };

  const agregarJugador = () => {
    if (nuevoNombre.trim() === "" || nuevoDorsal.trim() === "") return;
    if (jugadores.length >= 22) {
      alert("No se pueden añadir más de 22 jugadores.");
      return;
    }
    const enCancha = jugadores.length < 11;
    setJugadores([
      ...jugadores,
      {
        id: Date.now(),
        nombre: nuevoNombre,
        dorsal: nuevoDorsal,
        segundos: 0,
        enCancha,
        evento: "",
      },
    ]);
    setNuevoNombre("");
    setNuevoDorsal("");
  };

  const editarJugador = (id) => {
    const jugador = jugadores.find((j) => j.id === id);
    if (!jugador) return;
    setEditando(id);
    setNombreEditado(jugador.nombre);
    setDorsalEditado(jugador.dorsal);
  };

  const guardarEdicion = (id) => {
    setJugadores((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, nombre: nombreEditado, dorsal: dorsalEditado } : j
      )
    );
    setEditando(null);
  };

  const cancelarEdicion = () => setEditando(null);

  const cambiarJugador = (idSale, idEntra) => {
    if (!idSale || !idEntra) return;
    setJugadores((prev) =>
      prev.map((p) => {
        if (p.id === idSale) return { ...p, enCancha: false };
        if (p.id === idEntra) return { ...p, enCancha: true };
        return p;
      })
    );
  };

  const manejarEvento = (id, evento) => {
    if (!evento) return;
    setJugadores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, evento } : p))
    );
  };

  const exportarExcel = () => {
    const datos = jugadores.map((p) => ({
      Dorsal: p.dorsal,
      Nombre: p.nombre,
      Tiempo: formatearTiempo(p.segundos),
      Evento: p.evento || "",
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Resumen");
    XLSX.writeFile(libro, "resumen_minutos.xlsx");
  };

  const iniciar = () => setEnMarcha(true);
  const pausar = () => setEnMarcha(false);
  const reanudar = () => setEnMarcha(true);
  const finalizarPartido = () => {
    setEnMarcha(false);
    setFinalizado(true);
  };

  const nuevoPartido = () => {
    setJugadores([]);
    setTiempo(0);
    setFinalizado(false);
    setGolesLocal(0);
    setGolesVisitante(0);
  };

  const titulares = jugadores.filter((p) => p.enCancha);
  const suplentes = jugadores.filter((p) => !p.enCancha);

  if (finalizado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-green-200 flex flex-col items-center p-6">
        <h1 className="text-3xl font-bold text-emerald-800 mb-6">
          📊 Resumen del Partido
        </h1>
        <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-4xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-100 text-emerald-900">
                <th className="p-2">Dorsal</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Tiempo Jugado</th>
                <th className="p-2">Evento</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-emerald-100 text-center"
                >
                  <td className="p-2 font-semibold">{p.dorsal}</td>
                  <td className="p-2">{p.nombre}</td>
                  <td className="p-2">{formatearTiempo(p.segundos)}</td>
                  <td className="p-2">{p.evento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={exportarExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
          >
            💾 Descargar Excel
          </button>
          <button
            onClick={nuevoPartido}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
          >
            🔄 Nuevo Partido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen scale-[0.7] md:scale-[0.85] lg:scale-[1] origin-top bg-gradient-to-br from-green-50 via-emerald-100 to-green-200 flex flex-col items-center p-2 md:p-6">
      <motion.h1 className="text-xl md:text-3xl font-extrabold mb-4 text-emerald-900 tracking-wide drop-shadow-lg text-center">
        ⚽ Control de Minutos del Partido
      </motion.h1>

      {/* FORMULARIO DE AÑADIR JUGADOR */}
      <div className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-2xl shadow-md p-3 mb-6 flex flex-col sm:flex-row gap-2 items-center w-full max-w-3xl justify-between">
        <input
          type="text"
          placeholder="Dorsal"
          value={nuevoDorsal}
          onChange={(e) => setNuevoDorsal(e.target.value)}
          className="w-full sm:w-20 border px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50 text-gray-700 text-sm"
        />
        <input
          type="text"
          placeholder="Nombre del jugador"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="flex-1 border px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50 text-gray-700 text-sm"
        />
        <button
          onClick={agregarJugador}
          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 w-full sm:w-auto text-sm"
        >
          ➕ Añadir jugador
        </button>
      </div>

      {/* MARCADOR */}
      <div className="flex items-center justify-center gap-4 mb-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-md px-4 py-2 border border-emerald-200">
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-gray-600">Local</span>
          <input
            type="number"
            min="0"
            value={golesLocal}
            onChange={(e) => setGolesLocal(Number(e.target.value))}
            className="w-12 text-center border rounded-lg text-lg font-bold text-emerald-700"
          />
        </div>
        <span className="text-xl font-bold text-gray-700">-</span>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-gray-600">
            Visitante
          </span>
          <input
            type="number"
            min="0"
            value={golesVisitante}
            onChange={(e) => setGolesVisitante(Number(e.target.value))}
            className="w-12 text-center border rounded-lg text-lg font-bold text-emerald-700"
          />
        </div>
        <span className="ml-6 text-2xl md:text-4xl font-mono text-emerald-800 drop-shadow-sm">
          {formatearTiempo(tiempo)}
        </span>
      </div>

      {/* BOTONES CONTROL */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <button
          onClick={iniciar}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 text-sm"
        >
          ▶️ Comenzar
        </button>
        <button
          onClick={pausar}
          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 text-sm"
        >
          ⏸️ Pausar
        </button>
        <button
          onClick={reanudar}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 text-sm"
        >
          🔁 Reanudar
        </button>
        <button
          onClick={finalizarPartido}
          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 text-sm"
        >
          ⏹️ Finalizar
        </button>
      </div>

      {/* LISTA DE JUGADORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
        {[
          {
            titulo: "Titulares",
            color: "emerald",
            lista: jugadores.filter((p) => p.enCancha),
          },
          {
            titulo: "Suplentes",
            color: "gray",
            lista: jugadores.filter((p) => !p.enCancha),
          },
        ].map((grupo) => (
          <motion.div
            key={grupo.titulo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2
              className={`text-lg md:text-xl font-semibold text-${grupo.color}-900 mb-2 border-b-2 border-${grupo.color}-500 pb-1 text-center md:text-left`}
            >
              {grupo.titulo}
            </h2>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-2 space-y-1 min-h-[120px] border border-emerald-100 overflow-x-auto">
              {grupo.lista.map((jug) => (
                <motion.div
                  key={jug.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex flex-wrap justify-between items-center bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-200 rounded-xl shadow-sm p-1 transition-all"
                >
                  {editando === jug.id ? (
                    <>
                      <input
                        value={dorsalEditado}
                        onChange={(e) => setDorsalEditado(e.target.value)}
                        className="w-8 border rounded px-1 text-center text-xs"
                      />
                      <input
                        value={nombreEditado}
                        onChange={(e) => setNombreEditado(e.target.value)}
                        className="flex-1 border rounded px-2 text-xs"
                      />
                      <button
                        onClick={() => guardarEdicion(jug.id)}
                        className="text-green-700 text-xs font-bold ml-1"
                      >
                        💾
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="text-rose-600 text-xs font-bold ml-1"
                      >
                        ❌
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`w-8 text-center font-bold text-${grupo.color}-800 text-xs md:text-sm`}
                      >
                        {jug.dorsal}
                      </span>
                      <span className="flex-1 font-medium text-gray-900 text-xs md:text-sm">
                        {jug.nombre}
                      </span>
                      <span
                        className={`font-mono text-${grupo.color}-800 text-xs md:text-sm`}
                      >
                        {formatearTiempo(jug.segundos)}
                      </span>
                      <button
                        onClick={() => editarJugador(jug.id)}
                        className="text-blue-600 text-[10px] font-semibold ml-1"
                      >
                        ✏️
                      </button>
                      {grupo.titulo === "Titulares" && (
                        <select
                          className="border rounded-lg px-1 py-0.5 text-[10px] bg-gray-50 hover:bg-gray-100 cursor-pointer shadow-sm ml-1"
                          onChange={(e) =>
                            e.target.value &&
                            cambiarJugador(jug.id, parseInt(e.target.value))
                          }
                          defaultValue=""
                        >
                          <option value="">Cambio con...</option>
                          {suplentes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.dorsal} - {p.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="flex flex-wrap justify-end gap-1 mt-1 md:mt-0">
                        <select
                          className="border rounded-lg px-1 py-0.5 text-[10px] bg-yellow-50 hover:bg-yellow-100 cursor-pointer shadow-sm"
                          value={jug.evento}
                          onChange={(e) =>
                            manejarEvento(jug.id, e.target.value)
                          }
                        >
                          <option value="">Evento</option>
                          <option value="TA">TA</option>
                          <option value="DTA">DTA</option>
                          <option value="TR">TR</option>
                        </select>
                        {jug.evento && (
                          <span className="ml-1 text-[10px] text-amber-700 font-semibold">
                            {jug.evento}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
