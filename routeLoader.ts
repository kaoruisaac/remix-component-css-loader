import { getChildComponentLink } from "./utils";
const exportLinksReg = /^export (?:(?:const)|(?:function)) links[\s:(]/gm;

function routeLoader(raw: string, resourcePath: string, componentList: string[]): string {
  const regex = new RegExp(exportLinksReg);
  const links = getChildComponentLink(raw, resourcePath, componentList);
  if (!links.length) return raw;
  let newRaw = raw;
  const [found] = regex.exec(raw) || [];
  if (found) {
    newRaw = raw.replace(found, `${found.slice(0, found.length - 1)}_original${found[found.length - 1]}`);
    newRaw = `${newRaw}\nexport const links = () => [].concat(links_original(), ${links.join(', ')}).filter(v => v);`;
    return newRaw;
  }
  newRaw = `${newRaw}\nexport const links = () => [].concat((globalThis?.rootLinks || []), ${links.join(', ')}).filter(v => v);`;
  return newRaw;
}

export default routeLoader;
