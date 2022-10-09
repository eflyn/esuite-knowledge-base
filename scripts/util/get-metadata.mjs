export const getMetadata = (article) => {
  const metadata = {};
  for (const metadataStr of article.matchAll(/^\[_metadata_:(.*)?/gm)) {
    const [key, value] = metadataStr[0].split('_metadata_:')[1].split(']:- ');
    metadata[key] = eval(value); // quick and dirty way to remove single or double-quotes
  }
  return { ...metadata, date: new Date(metadata.date) };
}
