/*
Publish traverses the knowledge directory and generates a JSON output of all articles.
 */
import { readdir, readFile, writeFile, cp } from 'fs/promises'
import { Subject, of, mergeMap } from 'rxjs';
import { join } from 'path';
import { write } from 'fs';
async function main() {

  const getDirectories = async source =>
    (await readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

  const list = await getDirectories('./knowledge');

  const dataStream$ = of(...list);

  const data = [];

  dataStream$.pipe(
    mergeMap((async (folder) => {
      const articlePath = join('./knowledge', folder, 'index.md');
      const article = await readFile(articlePath, 'utf8');
      const metadata = {};
      for (const metadataStr of article.matchAll(/^\[_metadata_:(.*)?/gm)) {
        const [key, value] = metadataStr[0].split('_metadata_:')[1].split(']:- ');
        metadata[key] = eval(value); // quick and dirty way to remove single or double-quotes
      }
      return {
        ...metadata,
        handle: folder,
        date: new Date(metadata.date),
      }
    }), 4)
  ).subscribe({
    next: (d) => data.push(d),
    complete: async () => {
      await writeFile('dist/knowledge.json', JSON.stringify(data, null, 2));
      await cp('./knowledge', './dist/knowledge', {recursive: true});
    }
  });



}

main();
