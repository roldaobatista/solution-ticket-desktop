import re
from pathlib import Path

p = Path(r"C:\PROJETOS\Plataforma de Pesagem Veicular\solution-ticket-desktop\frontend\src\lib\api.ts")
src = p.read_text(encoding="utf-8")

# Adiciona helper logo apos o interceptor (depois da linha com "});" do interceptor de resposta)
helper = """
// Helper global: adapta arrays planos para formato PaginatedResponse
function toPaginated<T>(body: unknown, page?: number, limit?: number): { data: T[]; total: number; page: number; limit: number } {
  if (Array.isArray(body)) {
    return { data: body as T[], total: body.length, page: page ?? 1, limit: limit ?? body.length };
  }
  const obj = body as { data?: T[]; total?: number; page?: number; limit?: number };
  if (obj && typeof obj === 'object' && Array.isArray(obj.data)) {
    return {
      data: obj.data,
      total: obj.total ?? obj.data.length,
      page: obj.page ?? page ?? 1,
      limit: obj.limit ?? limit ?? obj.data.length,
    };
  }
  return { data: [], total: 0, page: page ?? 1, limit: limit ?? 10 };
}

"""
# inserir apos os interceptors, antes da primeira funcao de login
if "function toPaginated" not in src:
    # Inserir antes de "// Auth"
    src = src.replace("// Auth\n", helper + "// Auth\n", 1)

# Patch de cada funcao que retorna PaginatedResponse:
# padrao antigo:
#   const res = await apiClient.get(URL, { params: {...} });
#   return res.data;
# padrao novo:
#   const res = await apiClient.get(URL, { params: {...} });
#   return toPaginated(res.data, page, limit);
#
# Uso regex multi-line dentro de funcoes que declaram Promise<PaginatedResponse<...>>

def patch_fn(match):
    fn_body = match.group(0)
    # Ja tem toPaginated? pula
    if "toPaginated" in fn_body:
        return fn_body
    # Substituir `return res.data;` por `return toPaginated(res.data, page, limit);`
    fn_body = re.sub(
        r"return\s+res\.data;",
        "return toPaginated(res.data, page, limit);",
        fn_body,
        count=1,
    )
    return fn_body

# Match de funcoes assincronas que retornam PaginatedResponse
pattern = re.compile(
    r"export\s+async\s+function\s+\w+\s*\([^)]*\)\s*:\s*Promise<PaginatedResponse<[^>]+>>\s*\{.*?\n\}",
    re.DOTALL,
)
src = pattern.sub(patch_fn, src)

# Casos onde parametro nao se chama page/limit (ex: _page)
src = src.replace("toPaginated(res.data, page, limit)", "toPaginated(res.data, page ?? 1, limit ?? 10)")
# resolve casos _page
src = re.sub(r"toPaginated\(res\.data, _page \?\? 1, _limit \?\? 10\)", "toPaginated(res.data, _page, _limit)", src)

p.write_text(src, encoding="utf-8")
print("Patch aplicado. Chamadas paginadas agora auto-envelopam arrays plano.")
