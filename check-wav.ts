// node check-wav.ts
import assert from "node:assert";
import { encodeWav, OUT_RATE } from "./frogl-frontend/lib/wav.ts";

// 1 segundo a 48k -> debe quedar 1 segundo a 16k
const src = new Float32Array(48000);
for (let i = 0; i < src.length; i++) src[i] = Math.sin(i / 10);
const buf = encodeWav(src, 48000);
const dv = new DataView(buf);
const txt = (o: number, n: number) =>
  String.fromCharCode(...new Uint8Array(buf, o, n));

assert.equal(txt(0, 4), "RIFF");
assert.equal(txt(8, 4), "WAVE");
assert.equal(txt(12, 4), "fmt ");
assert.equal(txt(36, 4), "data");
assert.equal(dv.getUint16(20, true), 1, "PCM");
assert.equal(dv.getUint16(22, true), 1, "mono");
assert.equal(dv.getUint32(24, true), OUT_RATE, "16 kHz");
assert.equal(dv.getUint16(34, true), 16, "16 bits");
assert.equal(buf.byteLength, 44 + 16000 * 2, "1s remuestreado a 16k");
assert.equal(dv.getUint32(4, true), buf.byteLength - 8, "tamanio RIFF");
assert.equal(dv.getUint32(40, true), buf.byteLength - 44, "tamanio data");

// silencio no debe romper, y clipping se satura sin dar la vuelta
assert.equal(encodeWav(new Float32Array(0), 48000).byteLength, 44);
const alto = encodeWav(Float32Array.from([5, -5, 5]), 16000, 16000);
assert.equal(new DataView(alto).getInt16(44, true), 32767, "satura arriba");
assert.equal(new DataView(alto).getInt16(46, true), -32767, "satura abajo");

console.log("OK - encoder WAV correcto");
