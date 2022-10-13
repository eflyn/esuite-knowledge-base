/*
Publish traverses the knowledge directory and generates a JSON output of all articles.
 */
import { readFile, writeFile, cp, rm } from 'fs/promises'
import { of, mergeMap, merge, Subject, BehaviorSubject } from 'rxjs';
import { join } from 'path';
import { marked } from 'marked';
import { getDirectories } from './util/get-directories.mjs';
import { watch } from 'chokidar';
import express from 'express';
import markdownToc from 'markdown-toc';
import { getMetadata } from './util/get-metadata.mjs';

async function main() {

  const list = await getDirectories('./knowledge');

  const watchStream$ = new Subject();

  const dataStream$ = merge(watchStream$, of(...list));

  const directory = new Map();

  dataStream$.pipe(
    mergeMap((async (folder) => {
      const articlePath = join('./knowledge', folder, 'index.md');
      let article = await readFile(articlePath, 'utf8');
      const metadata = getMetadata(article);
      article = article.replace(/{{ DASHBOARD_URL }}/ig, 'https://demo.myeflyn.com/dashboard');
      await cp(join('./knowledge', folder), join('./preview/knowledge', folder), { recursive: true });
      const htmlPath = join('./preview/knowledge', folder, 'index.html');
      directory.set(folder, {
        ...metadata,
        path: join('knowledge', folder, 'index.html'),
      });
      const toc = marked(markdownToc(article, {
        firsth1: false,
        bullets: ['<br>', '<br>&nbsp;&nbsp;‣', '<br>&nbsp;&nbsp;&nbsp;&nbsp;‣', '<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;‣']
      }).content);
      await writeFile(htmlPath, `<!doctype html>
<html>
    <head>
        <title>Previewing ${folder}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
        <style>
            img { 
            display: block;
            max-width: 100%;
            border-radius: 6px;
            overflow: hidden;
            border: 3px solid #d6d6d6;
            margin: auto;
            }
            iframe {
            max-width: 100%;
            }
        </style>
    </head>
    <body>
    <div class="container py-5">
    <div class="row">
    
    <div class="col-12 ${toc?.length ? 'col-lg-9' : ''} order-2 order-lg-1">
        ${marked(article)}
    </div>
    ${(() => {
        return toc?.length ? `<div class="col-12 col-lg-3 order-1 order-lg-2">
          <div class="py-3" style="position: sticky; top: 0;">
          <h5>Table of Contents</h5>
          ${toc}
          </div>
        </div>` : '';
    })()}
</div>
    </div>
    </body>
</html>
      `);
      return folder;
    }), 4)
  ).subscribe({
    next: (d) => {
      console.log('Preview rendered for: ', d);
      writeFile('./preview/index.html', `<!doctype html>
<html>
    <head>
        <title>Preview Directory</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    </head>
    <body>
    <div class="container py-5">
    <div class="list-group">
    ${
        Array.from(directory.values()).sort((a, b) => a.title.charCodeAt(0) - b.title.charCodeAt(0)).map(({ title, description, path }) => {
          return `<a target="_blank" href="${path}" class="list-group-item list-group-item-action"><span class="font-weight-bold">${ title }</span><br><span class="text-muted">${description}</span></a>`
        }).join('\n')
      }
  </div>
    </div>
    </body>
</html>
      `);
    },
  });

  const render = (filepath) => {
    console.log('Rendering ', filepath);
    watchStream$.next(filepath.replace('knowledge/', '').split('/')[0]);
  };
  const remove = (filepath) => {
    console.log('Removed ', filepath);
    rm(join('./preview/', filepath), { recursive: true });
  };

  if (process.argv.includes('--watch')) {
    console.log('Watching for changes...');
    const app = express();
    app.use('/', express.static('./preview'));
    app.get('/', (req, res) => res.sendFile('./preview/index.html'));
    app.listen(4000, () => {
      console.log('Preview server running on http://localhost:4000');
    });
    watch('./knowledge/**/*.md', { ignoreInitial: true })
      .on('add', render)
      .on('change', render);
    watch('./knowledge/**/*', { ignoreInitial: true })
      .on('unlinkDir', remove);
  }

}

main();
