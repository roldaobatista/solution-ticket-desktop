'use client';

// Shim: reexporta a implementacao SSE real em @/components/balanca/PesoRealtime
// Assinatura compativel (balancaId, onPesoChange, compact, nome).
export { PesoRealtime, PesoRealtime as default } from '@/components/balanca/PesoRealtime';
