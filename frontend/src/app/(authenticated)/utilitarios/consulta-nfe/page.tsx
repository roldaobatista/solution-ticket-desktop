'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseXmlDocumento, vincularDocumentoTicket, DocumentoParseado } from '@/lib/api';
import { FileText, Search, Link2 } from 'lucide-react';

export default function ConsultaNfePage() {
  const [xml, setXml] = useState('');
  const [resultado, setResultado] = useState<DocumentoParseado | null>(null);
  const [numeroTicket, setNumeroTicket] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVincular, setLoadingVincular] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemVincular, setMensagemVincular] = useState<string | null>(null);

  const analisar = async () => {
    setErro(null);
    setResultado(null);
    setMensagemVincular(null);
    if (!xml.trim()) {
      setErro('Cole o XML para analisar');
      return;
    }
    setLoading(true);
    try {
      const r = await parseXmlDocumento(xml);
      setResultado(r);
    } catch (e: any) {
      setErro(e?.response?.data?.message || e?.message || 'Falha ao analisar XML');
    } finally {
      setLoading(false);
    }
  };

  const vincular = async () => {
    if (!resultado) return;
    if (!numeroTicket.trim()) {
      setMensagemVincular('Informe o numero do ticket');
      return;
    }
    setLoadingVincular(true);
    setMensagemVincular(null);
    try {
      const r = await vincularDocumentoTicket({
        numeroTicket: numeroTicket.trim(),
        chave: resultado.chave || '',
        tipo: resultado.tipo,
      });
      setMensagemVincular(r?.mensagem || 'Vinculacao registrada');
    } catch (e: any) {
      setMensagemVincular(e?.response?.data?.message || 'Falha ao vincular');
    } finally {
      setLoadingVincular(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consulta XML NFe / CTe</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cole o XML para extrair os dados do documento fiscal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-slate-500" />
            XML do documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full h-64 rounded border border-slate-300 p-3 text-xs font-mono"
            placeholder="Cole aqui o conteudo do XML..."
            value={xml}
            onChange={(e) => setXml(e.target.value)}
          />
          {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
          <div className="flex justify-end mt-3">
            <Button variant="primary" onClick={analisar} isLoading={loading}>
              <Search className="w-4 h-4 mr-2" />
              Analisar
            </Button>
          </div>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados extraidos ({resultado.tipo})</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Campo k="Tipo" v={resultado.tipo} />
              <Campo k="Chave" v={resultado.chave} mono />
              <Campo k="Numero" v={resultado.numero as any} />
              <Campo k="Serie" v={resultado.serie as any} />
              <Campo k="Emissor CNPJ" v={resultado.emissorCnpj} mono />
              <Campo k="Emissor" v={resultado.emissorNome} />
              <Campo k="Destinatario CNPJ" v={resultado.destinatarioCnpj} mono />
              <Campo k="Destinatario" v={resultado.destinatarioNome} />
              <Campo
                k="Peso bruto"
                v={resultado.pesoBruto != null ? `${resultado.pesoBruto} kg` : null}
              />
              <Campo
                k="Peso liquido"
                v={resultado.pesoLiquido != null ? `${resultado.pesoLiquido} kg` : null}
              />
              <Campo
                k="Valor total"
                v={resultado.valorTotal != null ? `R$ ${resultado.valorTotal.toFixed(2)}` : null}
              />
              <Campo k="Data emissao" v={resultado.dataEmissao as any} />
            </dl>

            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium text-slate-800 mb-2">Vincular ao ticket</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    label="Numero do ticket"
                    value={numeroTicket}
                    onChange={(e) => setNumeroTicket(e.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={vincular} isLoading={loadingVincular}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Vincular ao ticket
                </Button>
              </div>
              {mensagemVincular && (
                <p className="text-sm text-slate-600 mt-2">{mensagemVincular}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Campo({ k, v, mono }: { k: string; v?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-slate-500 uppercase tracking-wide">{k}</dt>
      <dd className={`text-slate-800 ${mono ? 'font-mono text-xs break-all' : ''}`}>{v ?? '-'}</dd>
    </div>
  );
}
