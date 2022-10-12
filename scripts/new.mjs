import slugify from 'slugify';
import { ensureDir } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { join } from 'path';
const title = process.argv[2];
const folderName = slugify(title).toLowerCase();

console.log(title, folderName);

async function main() {
  await ensureDir(join(`./knowledge/${folderName}`));
  await writeFile(join(`./knowledge/${folderName}/index.md`), `[_metadata_:title]:- '${title}'
[_metadata_:description]:- ""
[_metadata_:author]:- ""
[_metadata_:tags]:- ""
[_metadata_:date]:- "${new Date().toDateString()}"


# ${title}
`, 'utf8');
}
main();
