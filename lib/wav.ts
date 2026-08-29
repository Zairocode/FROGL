// Encoder WAV PCM16 mono. Puro y sin browser adentro: se testea con node.
// Existe porque Gemini acepta WAV con seguridad (verificado) y no quiero
// apostar a que trague el webm/opus que escupe MediaRecorder.

export const OUT_RATE = 16000; // suficiente para voz, y baja el payload 3x

export function encodeWav(
  src: Float32Array,
  srcRate: number,
  outRate = OUT_RATE,
): ArrayBuffer {
  const ratio = srcRate / outRate;
  const n = Math.max(0, Math.floor(src.length / ratio));
  const pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const v = src[Math.floor(i * ratio)] ?? 0;
    pcm[i] = Math.max(-1, Math.min(1, v)) * 0x7fff;
  }

  const bytes = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const dv = new DataView(buffer);
  const ascii = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };

  ascii(0, "RIFF");
  dv.setUint32(4, 36 + bytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  dv.setUint32(16, 16, true); // tamanio del bloque fmt
  dv.setUint16(20, 1, true); // 1 = PCM sin comprimir
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, outRate, true);
  dv.setUint32(28, outRate * 2, true); // bytes por segundo
  dv.setUint16(32, 2, true); // alineacion de bloque
  dv.setUint16(34, 16, true); // bits por muestra
  ascii(36, "data");
  dv.setUint32(40, bytes, true);
  new Int16Array(buffer, 44).set(pcm);
  return buffer;
}

export function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  // De a pedazos: String.fromCharCode(...) con un array enorme revienta la pila.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(s);
}
