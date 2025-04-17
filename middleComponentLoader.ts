const middleComponentLoader = (raw: string, resourcePath: string, links: string[]): string => {
  let newRaw = raw;
  const FileName = resourcePath.split(/\\|\//gm).pop()?.replace(/\.[t|j]sx/gm, '') || '';
  if (links.length > 0) {
    newRaw = `${newRaw}\n try {`
    newRaw = `${newRaw}\n${FileName}.STYLESHEET_LINKS = [].concat(${links.join(', ')}).filter(v => v)`;
    newRaw = `${newRaw}\n} catch {}`
  }
  return newRaw;
}

export default middleComponentLoader;

