import { useState } from 'react'
import Modal from './Modal'
import Field from './Field'
import Icono from './Icono'

/**
 * Confirmación para acciones destructivas (sin diálogos nativos del navegador).
 * Si pedirMotivo es true, exige escribir un motivo (mínimo 5 caracteres).
 */
export default function ConfirmModal({ titulo, mensaje, textoConfirmar = 'Confirmar', peligro = true, pedirMotivo = false, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const confirmar = async () => {
    if (pedirMotivo && motivo.trim().length < 5) { setError('Escribe el motivo (mínimo 5 caracteres)'); return }
    setEnviando(true)
    try { await onConfirm(motivo.trim()); onClose() } catch { /* el llamador muestra el error */ } finally { setEnviando(false) }
  }

  return (
    <Modal titulo={titulo} icono={peligro ? 'alerta' : 'check'} tono={peligro ? 'rojo' : 'menta'} onClose={onClose} ancho={480}
      footer={<>
        <button className="btn btn-outline" onClick={onClose} disabled={enviando}>Volver</button>
        <button className={`btn ${peligro ? 'btn-danger' : 'btn-primary'}`} onClick={confirmar} disabled={enviando}>
          {enviando ? <span className="spinner sm" /> : null} {textoConfirmar}
        </button>
      </>}>
      <p className="confirm-text">{mensaje}</p>
      {pedirMotivo && (
        <Field as="textarea" name="motivo" label="Motivo" rows={3} value={motivo} error={error} maxLength={255}
          onChange={(e) => { setMotivo(e.target.value); if (error) setError(e.target.value.trim().length >= 5 ? null : error) }} />
      )}
    </Modal>
  )
}
