import path from 'path';
import ts from 'typescript';

export function getTsConfigAliases() {
  // Find the path to tsconfig.json
  let configPath;
  try {
    configPath = ts.findConfigFile(path.resolve(), ts.sys.fileExists, 'tsconfig.json');
  } catch (error) {
    console.error(error);
  }
  if (!configPath) {
    throw new Error("tsconfig.json not found");
  }

  // Read tsconfig.json content
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  // Parse JSON configuration, this also handles extends and other cases
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));

  // Get baseUrl and paths
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

let aliases = {} as any;

aliases = getTsConfigAliases();

export { aliases };
interface Import {
  line: number;
  type: 'import-from' | 'side-effect';
  imported: string | null;
  path: string;
  raw: string;
}

export const getFilePath = (file: string) => {
  const filePath = file.replace(/\.[jt]sx$/, '');
  const filePathArray = filePath.split(/[/\\]/);
  if (filePathArray[filePathArray.length - 1] === filePathArray[filePathArray.length - 2]) {
    return filePath.replace(new RegExp(`[/\\\\]${filePathArray[filePathArray.length - 1]}$`), '');
  }
  return path.resolve(filePath);
}

export function findAllImports(content: string, resourcePath: string): Import[] {
  const lines = content.split('\n');
  const result = [] as any[];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Match import ... from 'xxx'
    const fromMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);

    // Match import 'xxx'
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

export const getChildComponentLink = (raw: string, resourcePath: string, componentList: string[], middleComponentMap?: Map<string, string[]>) => {
  const imports = findAllImports(raw, path.dirname(resourcePath));
  return imports
    .filter(({ path }) => componentList.includes(path) || middleComponentMap?.has(path))
    .map(({ imported }) => `${imported}?.['STYLESHEET_LINKS']`);
}