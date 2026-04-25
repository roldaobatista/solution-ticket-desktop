import re
from pathlib import Path

SCHEMA = Path(r"C:\PROJETOS\Plataforma de Pesagem Veicular\solution-ticket-desktop\backend\src\prisma\schema.prisma")
content = SCHEMA.read_text(encoding="utf-8")

# 1. Extrair nomes de todos os enums
enum_names = re.findall(r'^enum\s+(\w+)\s*\{', content, re.MULTILINE)
print(f"Enums encontrados: {len(enum_names)}")
for e in enum_names: print(f"  - {e}")

# 2. Remover blocos enum completos
enum_blocks = re.compile(r'^enum\s+\w+\s*\{[^}]*\}\s*\n?', re.MULTILINE | re.DOTALL)
content_new = enum_blocks.sub('', content)

# 3. Substituir usos dos enums como tipo de campo por String
# Padrao: "  nomeCampo  EnumName" ou "  nomeCampo  EnumName?"
for enum_name in enum_names:
    # Match: espacos, nome_campo, espacos, EnumName, opcional ?, espacos
    pattern = re.compile(r'(\s+\w+\s+)' + re.escape(enum_name) + r'(\??)(\s+)')
    content_new = pattern.sub(r'\1String\2\3', content_new)

# 4. Substituir Json por String
content_new = re.sub(r'(\s+\w+\s+)Json(\??)(\s+)', r'\1String\2\3', content_new)

# 5. Remover defaults que usam enum values (ex: @default(RASCUNHO))
# Precisa manter como string agora: @default("RASCUNHO")
def fix_default(m):
    value = m.group(1)
    return f'@default("{value}")'
content_new = re.sub(r'@default\(([A-Z][A-Z_0-9]+)\)', fix_default, content_new)

SCHEMA.write_text(content_new, encoding="utf-8")
print(f"\nSchema atualizado. Tamanho: {len(content_new)} chars")
print("Enums removidos, campos convertidos para String, defaults ajustados.")
