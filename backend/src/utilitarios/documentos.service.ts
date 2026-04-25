import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { errorMessage } from '../common/error-message.util';

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  parseXml(xml: string) {
    if (!xml || typeof xml !== 'string' || xml.trim().length === 0) {
      throw new BadRequestException('XML vazio');
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
      parseTagValue: true,
      trimValues: true,
    });

    let parsed: any;
    try {
      parsed = parser.parse(xml);
    } catch (err: unknown) {
      throw new BadRequestException('XML invalido: ' + errorMessage(err, 'parse error'));
    }

    const nfe = this.localizar(parsed, 'infNFe');
    const cte = this.localizar(parsed, 'infCte') || this.localizar(parsed, 'infCTe');

    if (nfe) return this.extrairNFe(nfe);
    if (cte) return this.extrairCTe(cte);

    throw new BadRequestException('Nao foi possivel identificar NFe ou CTe no XML');
  }

  private localizar(obj: any, chave: string): any {
    if (!obj || typeof obj !== 'object') return null;
    if (chave in obj) return obj[chave];
    for (const k of Object.keys(obj)) {
      const r = this.localizar(obj[k], chave);
      if (r) return r;
    }
    return null;
  }

  private extrairNFe(inf: any) {
    const chave = (inf?.['@_Id'] || '').replace(/^NFe/, '') || inf?.chNFe || null;
    const emit = inf?.emit || {};
    const dest = inf?.dest || {};
    const total = inf?.total?.ICMSTot || {};

    // peso: transp.vol.pesoB / pesoL
    const vols = inf?.transp?.vol;
    const vol = Array.isArray(vols) ? vols[0] : vols;
    const pesoBruto = this.num(vol?.pesoB);
    const pesoLiquido = this.num(vol?.pesoL);

    return {
      tipo: 'NFe',
      chave,
      emissorCnpj: emit?.CNPJ || emit?.CPF || null,
      emissorNome: emit?.xNome || null,
      destinatarioCnpj: dest?.CNPJ || dest?.CPF || null,
      destinatarioNome: dest?.xNome || null,
      pesoBruto,
      pesoLiquido,
      valorTotal: this.num(total?.vNF),
      numero: inf?.ide?.nNF || null,
      serie: inf?.ide?.serie || null,
      dataEmissao: inf?.ide?.dhEmi || inf?.ide?.dEmi || null,
    };
  }

  private extrairCTe(inf: any) {
    const chave = (inf?.['@_Id'] || '').replace(/^CTe/, '') || null;
    const emit = inf?.emit || {};
    const dest = inf?.dest || inf?.receb || inf?.toma3 || {};
    const vPrest = inf?.vPrest || {};
    const infCarga = inf?.infCTeNorm?.infCarga || inf?.infCarga || {};
    const infQ = infCarga?.infQ;
    let pesoBruto: number | null = null;
    let pesoLiquido: number | null = null;

    const infQArr = Array.isArray(infQ) ? infQ : infQ ? [infQ] : [];
    for (const q of infQArr) {
      const tipo = (q?.tpMed || '').toString().toUpperCase();
      const valor = this.num(q?.qCarga);
      if (tipo.includes('BRUTO')) pesoBruto = valor;
      else if (tipo.includes('LIQUIDO') || tipo.includes('LÍQUIDO')) pesoLiquido = valor;
      else if (pesoBruto == null) pesoBruto = valor;
    }

    return {
      tipo: 'CTe',
      chave,
      emissorCnpj: emit?.CNPJ || emit?.CPF || null,
      emissorNome: emit?.xNome || null,
      destinatarioCnpj: dest?.CNPJ || dest?.CPF || null,
      destinatarioNome: dest?.xNome || null,
      pesoBruto,
      pesoLiquido,
      valorTotal: this.num(vPrest?.vTPrest || vPrest?.vRec),
      numero: inf?.ide?.nCT || null,
      serie: inf?.ide?.serie || null,
      dataEmissao: inf?.ide?.dhEmi || null,
    };
  }

  private num(v: any): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  async vincularTicket(body: {
    ticketId?: string;
    numeroTicket?: string;
    chave: string;
    tipo: string;
  }) {
    // Stub: endpoint de vinculacao pode evoluir conforme regra de negocio.
    this.logger.log(
      `Stub vincular: ticket=${body?.ticketId || body?.numeroTicket} chave=${body?.chave}`,
    );
    return {
      ok: true,
      mensagem: 'Vinculacao registrada (stub). Implementar persistencia conforme regra definitiva.',
      recebido: body,
    };
  }
}
