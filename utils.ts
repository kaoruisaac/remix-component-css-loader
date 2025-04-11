import path from 'path';

interface Import {
  line: number;
  type: 'import-from' | 'side-effect';
  imported: string | null;
  path: string;
  raw: string;
}

export function findAllImports(content: string, resourcePath: string): Import[] {
  const lines = content.split('\n');
  const result: Import[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 匹配 import ... from 'xxx'
    const fromMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);

    // 匹配 import 'xxx'
    const sideEffectMatch = trimmed.match(/^import\s+['"]([^'"]+)['"]/);

    if (fromMatch) {
      result.push({
        line: index + 1,
        type: 'import-from',
        imported: fromMatch[1].trim().replace(/,?\s?\{.*}/, ''),
        path: path.resolve(resourcePath.replace(/\.[jt]sx$/, ''), fromMatch[2].trim()),
        raw: trimmed,
      });
    } else if (sideEffectMatch) {
      result.push({
        line: index + 1,
        type: 'side-effect',
        imported: null,
        path: path.resolve(resourcePath.replace(/\.[jt]sx$/, ''), sideEffectMatch[1].trim()),
        raw: trimmed,
      });
    }
  });

  return result;
}

export const getChildComponentLink = (raw: string, resourcePath: string, componentList: string[]): string[] => {
  const imports = findAllImports(raw, path.dirname(resourcePath))
    .filter(({ path }) => componentList.includes(path));
  return imports.map(({ imported }) => `${imported}?.['STYLESHEET_LINKS']`);
}