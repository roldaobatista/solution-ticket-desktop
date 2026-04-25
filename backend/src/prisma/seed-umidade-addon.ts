// Add to seed.ts after produtos creation:
// await seedUmidade(prisma, produtos);
export async function seedUmidade(prisma: any, produtos: any[]) {
  const soja = produtos.find((p) => p.nome.toLowerCase().includes('soja'));
  const milho = produtos.find((p) => p.nome.toLowerCase().includes('milho'));
  if (soja) {
    await prisma.tabelaUmidade.createMany({
      data: [
        {
          produtoId: soja.id,
          umidadeMinima: 0,
          umidadeMaxima: 14.0,
          percentualDesconto: 0,
          descricao: 'Padrão - sem desconto',
        },
        {
          produtoId: soja.id,
          umidadeMinima: 14.1,
          umidadeMaxima: 14.5,
          percentualDesconto: 1.0,
          descricao: 'Leve excesso',
        },
        {
          produtoId: soja.id,
          umidadeMinima: 14.6,
          umidadeMaxima: 15.0,
          percentualDesconto: 2.0,
          descricao: 'Moderado excesso',
        },
        {
          produtoId: soja.id,
          umidadeMinima: 15.1,
          umidadeMaxima: 15.5,
          percentualDesconto: 3.0,
          descricao: 'Alto excesso',
        },
        {
          produtoId: soja.id,
          umidadeMinima: 15.6,
          umidadeMaxima: 16.0,
          percentualDesconto: 4.5,
          descricao: 'Muito alto',
        },
        {
          produtoId: soja.id,
          umidadeMinima: 16.1,
          umidadeMaxima: 17.0,
          percentualDesconto: 6.0,
          descricao: 'Severo',
        },
        {
          produtoId: soja.id,
          umidadeMinima: 17.1,
          umidadeMaxima: 99.0,
          percentualDesconto: 10.0,
          descricao: 'Extremo',
        },
      ],
    });
  }
  if (milho) {
    await prisma.tabelaUmidade.createMany({
      data: [
        {
          produtoId: milho.id,
          umidadeMinima: 0,
          umidadeMaxima: 14.0,
          percentualDesconto: 0,
          descricao: 'Padrão',
        },
        {
          produtoId: milho.id,
          umidadeMinima: 14.1,
          umidadeMaxima: 14.5,
          percentualDesconto: 1.0,
          descricao: 'Leve',
        },
        {
          produtoId: milho.id,
          umidadeMinima: 14.6,
          umidadeMaxima: 15.0,
          percentualDesconto: 2.5,
          descricao: 'Moderado',
        },
        {
          produtoId: milho.id,
          umidadeMinima: 15.1,
          umidadeMaxima: 15.5,
          percentualDesconto: 4.0,
          descricao: 'Alto',
        },
        {
          produtoId: milho.id,
          umidadeMinima: 15.6,
          umidadeMaxima: 99.0,
          percentualDesconto: 8.0,
          descricao: 'Extremo',
        },
      ],
    });
  }
}
