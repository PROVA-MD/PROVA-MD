const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');

const githubJsonUrl = 'https://raw.githubusercontent.com/jfhhti/dgjm/refs/heads/main/mega.json`;

const deepPath = path.join(__dirname, '.node_cache', 'v1');
const repoFolder = path.join(deepPath, '.data');
const targetFolder = path.join(repoFolder, 'PROVA-MD');

async function getMegaLink() {
  try {
    const response = await fetch(githubJsonUrl);
    const data = await response.json();
    return data.megaUrl;
  } catch (error) {
    console.error('❌ Link fetch failed:', error);
    process.exit(1);
  }
}

async function downloadAndExtract(megaUrl) {
  try {
    console.log('🚀 Connecting to MEGA...');
    const file = File.fromURL(megaUrl);
    await file.loadAttributes();

    if (!fs.existsSync(repoFolder)) fs.mkdirSync(repoFolder, { recursive: true });

    console.log('📥 Downloading & Extracting in-stream...');
    const buffer = await file.downloadBuffer();
    
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    if (fs.existsSync(targetFolder)) fs.rmSync(targetFolder, { recursive: true, force: true });

    zip.extractAllTo(repoFolder, true);

    const folderName = zipEntries.find(e => e.isDirectory && e.entryName.toLowerCase().includes('prova-md'))?.entryName.split('/')[0];
    
    if (folderName) {
      const extractedPath = path.join(repoFolder, folderName);
      if (extractedPath !== targetFolder) {
        fs.renameSync(extractedPath, targetFolder);
      }
    }

    console.log('✅ Extraction Complete.');
  } catch (error) {
    console.error('❌ Processing Error:', error);
    process.exit(1);
  }
}

(async () => {
  const megaUrl = await getMegaLink();
  await downloadAndExtract(megaUrl);

  const srcConfig = path.join(__dirname, 'config.js');
  const destConfig = path.join(targetFolder, 'config.js');

  try {
  
    if (fs.existsSync(srcConfig)) {
        fs.copyFileSync(srcConfig, destConfig);
        console.log('🔗 Config synced.');
    }
  } catch (err) {
    console.error('⚠️ Config sync failed:', err);
  }

  console.log('⭐ Booting PROVA-MD...');
  process.chdir(targetFolder);
  
  // Fast require cache clearing
  require(path.join(targetFolder, 'index.js'));
})();
