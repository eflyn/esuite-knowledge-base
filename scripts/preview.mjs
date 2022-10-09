/*
Publish traverses the knowledge directory and generates a JSON output of all articles.
 */
import { readdir, readFile, writeFile, cp } from 'fs/promises'
import { Subject, of, mergeMap } from 'rxjs';
import { join } from 'path';
import { write } from 'fs';
import { marked } from 'marked';
import { getDirectories } from './util/get-directories.mjs';
async function main() {

  const list = await getDirectories('./knowledge');

  const dataStream$ = of(...list);

  dataStream$.pipe(
    mergeMap((async (folder) => {
      const articlePath = join('./knowledge', folder, 'index.md');
      let article = await readFile(articlePath, 'utf8');
      article = article.replace(/{{ DASHBOARD_URL }}/ig, 'https://demo.myeflyn.com/dashboard');
      await cp(join('./knowledge', folder), join('./preview/knowledge', folder), { recursive: true });
      await writeFile(join('./preview/knowledge', folder, 'index.html'), `<!doctype html>
<html>
    <head>
        <title>Previewing ${folder}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    </head>
    <body>
    <div class="container py-5">
    ${marked(article)}
    </div>
    </body>
</html>
      `);
      return folder;
    }), 4)
  ).subscribe({
    next: (d) => {
      console.log('Preview rendered for: ', d);
    },
  });



}

main();
