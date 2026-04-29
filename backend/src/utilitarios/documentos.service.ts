import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { errorMessage } from '../common/error-message.util';
import { PrismaService } from '../prisma/prisma.service';

type XmlNode = string | number | boolean | null | XmlNode[] | { [k: string]: XmlNode };
type XmlObject = { [k: string]: XmlNode };

function asObject(v: unknown): XmlObject | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as XmlObject) : null;
}
function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : v == null ? null : String(v);
}

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);
  constructor(private readonly prisma: PrismaService) {}

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

    let parsed: XmlNode;
    try {
      parsed = parser.parse(xml) as XmlNode;
    } catch (err: unknown) {
      throw new BadRequestException('XML invalido: ' + errorMessage(err, 'parse error'));
    }

    const nfe = asObject(this.localizar(parsed, 'infNFe'));
    const cte = asObject(this.localizar(parsed, 'infCte') ?? this.localizar(parsed, 'infCTe'));

    if (nfe) return this.extrairNFe(nfe);
    if (cte) return this.extrairCTe(cte);

    throw new BadRequestException('Nao foi possivel identificar NFe ou CTe no XML');
  }

  private localizar(node: XmlNode, chave: string): XmlNode | null {
    const obj = asObject(node);
    if (!obj) return null;
    if (chave in obj) return obj[chave];
    for (const k of Object.keys(obj)) {
      const r = this.localizar(obj[k], chave);
      if (r) return r;
    }
    return null;
  }

  private extrairNFe(inf: XmlObject) {
    const chave = (asString(inf['@_Id']) || '').replace(/^NFe/, '') || asString(inf.chNFe);
    const emit = asObject(inf.emit) ?? {};
    const dest = asObject(inf.dest) ?? {};
    const total = asObject(asObject(inf.total)?.ICMSTot) ?? {};
    const ide = asObject(inf.ide) ?? {};

    const vols = asObject(inf.transp)?.vol;
    const vol = asObject(Array.isArray(vols) ? vols[0] : vols) ?? {};
    const pesoBruto = this.num(vol.pesoB);
    const pesoLiquido = this.num(vol.pesoL);

    return {
      tipo: 'NFe',
      chave,
      emissorCnpj: asString(emit.CNPJ) ?? asString(emit.CPF),
      emissorNome: asString(emit.xNome),
      destinatarioCnpj: asString(dest.CNPJ) ?? asString(dest.CPF),
      destinatarioNome: asString(dest.xNome),
      pesoBruto,
      pesoLiquido,
      valorTotal: this.num(total.vNF),
      numero: asString(ide.nNF),
      serie: asString(ide.serie),
      dataEmissao: asString(ide.dhEmi) ?? asString(ide.dEmi),
    };
  }

  private extrairCTe(inf: XmlObject) {
    const chave = (asString(inf['@_Id']) || '').replace(/^CTe/, '') || null;
    const emit = asObject(inf.emit) ?? {};
    const dest = asObject(inf.dest) ?? asObject(inf.receb) ?? asObject(inf.toma3) ?? {};
    const vPrest = asObject(inf.vPrest) ?? {};
    const infCarga = asObject(asObject(inf.infCTeNorm)?.infCarga) ?? asObject(inf.infCarga) ?? {};
    const ide = asObject(inf.ide) ?? {};

    const infQRaw = infCarga.infQ;
    let pesoBruto: number | null = null;
    let pesoLiquido: number | null = null;

    const infQArr: XmlObject[] = (Array.isArray(infQRaw) ? infQRaw : infQRaw ? [infQRaw] : [])
      .map(asObject)
      .filter((x): x is XmlObject => x !== null);
    for (const q of infQArr) {
      const tipo = (asString(q.tpMed) ?? '').toUpperCase();
      const valor = this.num(q.qCarga);
      if (tipo.includes('BRUTO')) pesoBruto = valor;
      else if (tipo.includes('LIQUIDO') || tipo.includes('LÍQUIDO')) pesoLiquido = valor;
      else if (pesoBruto == null) pesoBruto = valor;
    }

    return {
      tipo: 'CTe',
      chave,
      emissorCnpj: asString(emit.CNPJ) ?? asString(emit.CPF),
      emissorNome: asString(emit.xNome),
      destinatarioCnpj: asString(dest.CNPJ) ?? asString(dest.CPF),
      destinatarioNome: asString(dest.xNome),
      pesoBruto,
      pesoLiquido,
      valorTotal: this.num(vPrest.vTPrest ?? vPrest.vRec),
      numero: asString(ide.nCT),
      serie: asString(ide.serie),
      dataEmissao: asString(ide.dhEmi),
    };
  }

  private num(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  async vincularTicket(
    body: {
      ticketId?: string;
      numeroTicket?: string;
      chave: string;
      tipo: string;
    },
    tenantId: string,
  ) {
    if (!body.chave || !body.tipo) throw new BadRequestException('tipo e chave sao obrigatorios');
    const ticket = await this.prisma.ticketPesagem.findFirst({
      where: body.ticketId
        ? { id: body.ticketId, tenantId }
        : { numero: body.numeroTicket, tenantId },
      select: { id: true },
    });
    if (!ticket) throw new BadRequestException('Ticket nao encontrado para o tenant autenticado');

    const existente = await this.prisma.documentoPesagem.findFirst({
      where: { ticketId: ticket.id, tipo: body.tipo, numero: body.chave },
    });
    if (existente) return { ok: true, documento: existente, idempotente: true };

    const documento = await this.prisma.documentoPesagem.create({
      data: {
        ticketId: ticket.id,
        tipo: body.tipo,
        numero: body.chave,
        observacao: `Vinculo fiscal ${body.tipo} chave ${body.chave}`,
      },
    });
    this.logger.log(`Documento fiscal vinculado: ticket=${ticket.id} chave=${body.chave}`);
    return { ok: true, documento, idempotente: false };
  }
}
