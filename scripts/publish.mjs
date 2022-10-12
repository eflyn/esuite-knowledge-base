/*
Publish traverses the knowledge directory and generates a JSON output of all articles.
 */
import { readdir, readFile, writeFile, cp } from 'fs/promises'
import { Subject, of, mergeMap } from 'rxjs';
import { join } from 'path';
import { write } from 'fs';
import { getMetadata } from './util/get-metadata.mjs';
import { getDirectories } from './util/get-directories.mjs';
async function main() {

  const list = await getDirectories('./knowledge');

  const dataStream$ = of(...list);

  const data = [];

  dataStream$.pipe(
    mergeMap((async (folder) => {
      const articlePath = join('./knowledge', folder, 'index.md');
      const article = await readFile(articlePath, 'utf8');
      const metadata = getMetadata(article);
      return {
        ...metadata,
        handle: folder,
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
