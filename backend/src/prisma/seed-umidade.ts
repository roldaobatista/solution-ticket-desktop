import { PrismaClient } from '@prisma/client';
import { stderr, stdout } from 'process';

const prisma = new PrismaClient();
const log = (message: string) => stdout.write(`${message}\n`);
const logError = (error: unknown) =>
  stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);

async function seedUmidade() {
  // Soja - tabela padrão
  const produtos = await prisma.produto.findMany();
  const soja = produtos.find((p) => p.descricao.toLowerCase().includes('soja'));
  const milho = produtos.find((p) => p.descricao.toLowerCase().includes('milho'));

  const vigenciaInicio = new Date();

  if (soja) {
    await prisma.tabelaUmidade.createMany({
      data: [
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 0,
          faixaFinal: 14,
          descontoPercentual: 0,
          vigenciaInicio,
        },
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 14.1,
          faixaFinal: 14.5,
          descontoPercentual: 1.0,
          vigenciaInicio,
        },
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 14.6,
          faixaFinal: 15.0,
          descontoPercentual: 2.0,
          vigenciaInicio,
        },
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 15.1,
          faixaFinal: 15.5,
          descontoPercentual: 3.0,
          vigenciaInicio,
        },
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 15.6,
          faixaFinal: 16.0,
          descontoPercentual: 4.5,
          vigenciaInicio,
        },
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 16.1,
          faixaFinal: 17.0,
          descontoPercentual: 6.0,
          vigenciaInicio,
        },
        {
          produtoId: soja.id,
          tenantId: soja.tenantId,
          faixaInicial: 17.1,
          faixaFinal: 99.0,
          descontoPercentual: 10.0,
          vigenciaInicio,
        },
      ],
    });
    log('Tabela de umidade para Soja criada');
  }

  if (milho) {
    await prisma.tabelaUmidade.createMany({
      data: [
        {
          produtoId: milho.id,
          tenantId: milho.tenantId,
          faixaInicial: 0,
          faixaFinal: 14,
          descontoPercentual: 0,
          vigenciaInicio,
        },
        {
          produtoId: milho.id,
          tenantId: milho.tenantId,
          faixaInicial: 14.1,
          faixaFinal: 14.5,
          descontoPercentual: 1.0,
          vigenciaInicio,
        },
        {
          produtoId: milho.id,
          tenantId: milho.tenantId,
          faixaInicial: 14.6,
          faixaFinal: 15.0,
          descontoPercentual: 2.5,
          vigenciaInicio,
        },
        {
          produtoId: milho.id,
          tenantId: milho.tenantId,
          faixaInicial: 15.1,
          faixaFinal: 15.5,
          descontoPercentual: 4.0,
          vigenciaInicio,
        },
        {
          produtoId: milho.id,
          tenantId: milho.tenantId,
          faixaInicial: 15.6,
          faixaFinal: 16.0,
          descontoPercentual: 5.5,
          vigenciaInicio,
        },
        {
          produtoId: milho.id,
          tenantId: milho.tenantId,
          faixaInicial: 16.1,
          faixaFinal: 99.0,
          descontoPercentual: 8.0,
          vigenciaInicio,
        },
      ],
    });
    log('Tabela de umidade para Milho criada');
  }
}

seedUmidade().catch(logError);
