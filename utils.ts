import path from 'path';
import ts from 'typescript';

export function getTsConfigAliases() {
  // 尋找 tsconfig.json 的路徑
  const configPath = ts.findConfigFile(path.resolve(), ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    throw new Error("找不到 tsconfig.json");
  }
  
  // 讀取 tsconfig.json 內容
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  // 解析 JSON 設定，這裡也會處理 extends 等情況
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
  
  // 取得 baseUrl 與 paths
  const baseUrl = parsed.options.baseUrl || '.';
  const paths = parsed.options.paths || {};
  const aliases = {} as any;
  
  for (const alias in paths) {
    const key = alias.replace(/\*$/, '');
    const targetArray = paths[alias];
    const resolvedTarget = path.resolve(path.dirname(configPath), baseUrl, targetArray[0].replace(/\*$/, ''));
    aliases[key] = resolvedTarget;
  }
  
  return aliases;
}

export const aliases = getTsConfigAliases();

interface Import {
  line: number;
  type: 'import-from' | 'side-effect';
  imported: string | null;
  path: string;
  raw: string;
}

export function findAllImports(content: string, resourcePath: string): Import[] {
  const lines = content.split('\n');
  const result = [] as any[];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 匹配 import ... from 'xxx'
    const fromMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);

    // 匹配 import 'xxx'
    const sideEffectMatch = trimmed.match(/^import\s+['"]([^'"]+)['"]/);

    if (fromMatch) {
      let aliasPath;
      Object.keys(aliases).forEach((key) => {
        if (fromMatch[2].trim().startsWith(key)) {
          aliasPath = aliases[key] + '/' + fromMatch[2].trim().replace(key, '');
        }
      });
      result.push({
        line: index + 1,
        type: 'import-from',
        imported: fromMatch[1].trim().replace(/,?\s?\{.*}/, ''),
        path: aliasPath ? path.resolve(aliasPath) : path.resolve(resourcePath.replace(/\.[jt]sx$/, ''), fromMatch[2].trim()),
        rawPath: fromMatch[2].trim(),
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

export const getChildComponentLink = (raw: string, resourcePath: string, componentList: string[]) => {
  const imports = findAllImports(raw, path.dirname(resourcePath));
  return imports
    .filter(({ path }) => componentList.includes(path))
    .map(({ imported }) => `${imported}?.['STYLESHEET_LINKS']`);
}