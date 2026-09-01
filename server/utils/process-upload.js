const path = require('path');
const AdmZip = require('adm-zip');

// File extensions considered readable as text/source code
const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.swift', '.kt', '.kts', '.scala', '.php', '.lua',
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.styl',
  '.vue', '.svelte', '.astro',
  '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.xml', '.svg', '.graphql', '.gql',
  '.md', '.mdx', '.txt', '.rst', '.csv',
  '.env', '.env.example', '.gitignore', '.dockerignore', '.editorconfig',
  '.sh', '.bash', '.zsh', '.fish', '.bat', '.ps1', '.cmd',
  '.sql', '.prisma', '.graphql',
  '.dockerfile', '.makefile',
  '.lock', '.log'
]);

// Files larger than this are still accepted and counted in the tree,
// but their text contents are not read into the analysis source code
// (binary / oversized files are skipped for code analysis only).
const MAX_FILE_SIZE = 512 * 1024; // 512 KB — text-read threshold for analysis
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1 GB total upload budget
const MAX_FILES = 2000;

/**
 * Check if a file should be treated as text
 */
function isTextFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename).toLowerCase();

  // Check known text filenames without extensions
  const knownFiles = new Set([
    'dockerfile', 'makefile', 'gemfile', 'rakefile', 'procfile',
    'vagrantfile', '.gitignore', '.dockerignore', '.editorconfig',
    '.env', '.env.example', '.env.local', '.env.production',
    '.babelrc', '.eslintrc', '.prettierrc', '.npmrc',
    'readme', 'license', 'changelog', 'authors'
  ]);

  if (knownFiles.has(base)) return true;
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return false;
}

/**
 * Build an indented file tree string from an array of relative paths
 */
function buildFileTree(filePaths) {
  const tree = {};

  for (const fp of filePaths) {
    const parts = fp.split('/').filter(Boolean);
    let node = tree;
    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
  }

  const lines = [];
  function walk(obj, indent) {
    const entries = Object.keys(obj).sort((a, b) => {
      const aIsDir = Object.keys(obj[a]).length > 0;
      const bIsDir = Object.keys(obj[b]).length > 0;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    for (const key of entries) {
      const children = Object.keys(obj[key]);
      if (children.length > 0) {
        lines.push(`${indent}${key}/`);
        walk(obj[key], indent + '  ');
      } else {
        lines.push(`${indent}${key}`);
      }
    }
  }

  walk(tree, '');
  return lines.join('\n');
}

/**
 * Process multer files array (from folder upload) into structured data
 * @param {Array} files - multer file objects with .buffer and .originalname
 * @param {string} relativePathField - the req.body field containing relative paths (JSON)
 * @returns {{ fileStructure: string, sourceCode: string, fileCount: number, totalSize: number }}
 */
function processUploadedFiles(files, relativePaths) {
  if (!files || files.length === 0) {
    return { fileStructure: '', sourceCode: '', fileCount: 0, totalSize: 0 };
  }

  // Build mapping: index -> relative path
  // The frontend sends relative paths keyed by file index: {"0": "Project/src/index.js", ...}
  let pathMap = {};
  if (relativePaths) {
    try {
      pathMap = JSON.parse(relativePaths);
    } catch (e) {
      // fallback: use originalname
    }
  }

  const filePaths = [];
  const codeParts = [];
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Look up relative path by index first, then by originalname_key, then fallback
    const relativePath = pathMap[String(i)]
      || pathMap[file.originalname + '_' + file.fieldname]
      || pathMap[file.originalname]
      || file.originalname;

    // Normalise path separators
    const normalised = relativePath.replace(/\\/g, '/');
    filePaths.push(normalised);
    totalSize += file.size;

    if (totalSize > MAX_TOTAL_SIZE) break;

    if (isTextFile(normalised) && file.size < MAX_FILE_SIZE) {
      const content = file.buffer.toString('utf-8');
      codeParts.push(`// === FILE: ${normalised} ===\n${content}\n`);
    }
  }

  return {
    fileStructure: buildFileTree(filePaths),
    sourceCode: codeParts.join('\n'),
    fileCount: filePaths.length,
    totalSize
  };
}

/**
 * Process a zip file buffer into structured data
 * @param {Buffer} zipBuffer
 * @returns {{ fileStructure: string, sourceCode: string, fileCount: number, totalSize: number }}
 */
function processZipUpload(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // First pass: collect all file entries and detect wrapper directory
  const rawPaths = [];
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.replace(/\\/g, '/');
    if (name.startsWith('__MACOSX/') || name.includes('.DS_Store')) continue;
    rawPaths.push(name);
  }

  // Detect if all entries share a single top-level wrapper directory
  const topLevelDirs = new Set();
  for (const p of rawPaths) {
    const parts = p.split('/');
    if (parts.length > 1) topLevelDirs.add(parts[0]);
    else topLevelDirs.add(null); // file at root level
  }

  const shouldStrip = topLevelDirs.size === 1 && !topLevelDirs.has(null);

  // Second pass: process with correct paths
  const filePaths = [];
  const codeParts = [];
  let totalSize = 0;
  let fileCount = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (fileCount >= MAX_FILES) break;

    let entryName = entry.entryName.replace(/\\/g, '/');
    if (entryName.startsWith('__MACOSX/') || entryName.includes('.DS_Store')) continue;

    // Only strip wrapper if all files share the same top-level dir
    if (shouldStrip) {
      const parts = entryName.split('/');
      entryName = parts.slice(1).join('/');
    }

    if (!entryName) continue;

    filePaths.push(entryName);
    totalSize += entry.header.size;
    fileCount++;

    if (totalSize > MAX_TOTAL_SIZE) break;

    if (isTextFile(entryName) && entry.header.size < MAX_FILE_SIZE) {
      try {
        const content = entry.getData().toString('utf-8');
        codeParts.push(`// === FILE: ${entryName} ===\n${content}\n`);
      } catch (e) {
        // skip binary files that fail decoding
      }
    }
  }

  return {
    fileStructure: buildFileTree(filePaths),
    sourceCode: codeParts.join('\n'),
    fileCount,
    totalSize
  };
}

module.exports = { processUploadedFiles, processZipUpload, isTextFile, buildFileTree };
