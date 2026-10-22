import {
  Directory,
  File,
  Paths,
} from 'expo-file-system';

/*
============================================================
AUTOMATIC SAFETY BACKUPS
============================================================

Every time the app opens with rankings, a copy of the saved
data is written to the phone's documents folder. The newest
KEEP_LATEST are kept and listed on the Backup screen, so a
mistake can always be undone.

Same format as a manual backup file, so the same restore
code reads both.
============================================================
*/

const KEEP_LATEST = 7;

const FOLDER_NAME = 'auto-backups';


function getFolder() {

  const folder = new Directory(
    Paths.document,
    FOLDER_NAME
  );

  if (!folder.exists) {
    folder.create({ intermediates: true, idempotent: true });
  }

  return folder;
}


// Newest first: [{ file, name }]
function listFiles() {

  return getFolder()
    .list()
    .filter(
      item =>
        item instanceof File &&
        item.name.endsWith('.json')
    )
    .sort((a, b) => b.name.localeCompare(a.name));
}


// data: { myRankings, fotrankrLists, comparisonHistory,
//         fotrankrProgress, fotrankrProfile }
export function saveAutoBackup(data) {

  try {

    if (!data?.myRankings?.length) {
      return;
    }

    const exportedAt = new Date().toISOString();

    // Sortable, file-name-safe timestamp.
    const stamp = exportedAt.replace(/[:.]/g, '-');

    const file = new File(
      getFolder(),
      `fotrankr-auto-${stamp}.json`
    );

    file.create();

    file.write(
      JSON.stringify({
        app: 'FotRankr',
        version: 1,
        exportedAt,
        automatic: true,
        data,
      })
    );

    listFiles()
      .slice(KEEP_LATEST)
      .forEach(old => old.delete());

  } catch (error) {

    // A failed safety copy must never stop the app.
    console.log(
      'FOTRANKR AUTO BACKUP ERROR:',
      error
    );

  }
}


// Newest first: [{ uri, exportedAt, rankings, lists }]
export async function listAutoBackups() {

  try {

    const backups = [];

    for (const file of listFiles()) {

      try {

        const backup = JSON.parse(await file.text());

        backups.push({
          uri: file.uri,
          exportedAt: backup.exportedAt,
          rankings: backup.data?.myRankings?.length || 0,
          lists: backup.data?.fotrankrLists?.length || 0,
        });

      } catch (error) {
        // Skip unreadable files.
      }
    }

    return backups;

  } catch (error) {

    console.log(
      'FOTRANKR AUTO BACKUP LIST ERROR:',
      error
    );

    return [];
  }
}


export async function readAutoBackup(uri) {
  return JSON.parse(await new File(uri).text());
}
