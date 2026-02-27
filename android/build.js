#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n▶ ${description}...`, colors.blue);
  try {
    execSync(command, { cwd: __dirname, stdio: 'inherit', shell: true });
    log(`✅ ${description}完成`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description}失败: ${error.message}`, colors.red);
    return false;
  }
}

function askQuestion(question, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

async function getUserConfig() {
  log('\n=========================================', colors.bright);
  log('  应用配置', colors.bright);
  log('=========================================', colors.bright);

  const appName = await askQuestion('应用名称', 'ChatterBox');
  const packageName = await askQuestion('包名 (如: com.example.app)', 'com.syntrx.chatterbox');
  const iconAnswer = await askQuestion('使用默认图标? (y/n)', 'y');
  const useDefaultIcon = iconAnswer.toLowerCase() === 'y';

  return { appName, packageName, useDefaultIcon };
}

function updateCapacitorConfig(config) {
  const configPath = join(__dirname, 'capacitor.config.json');
  const currentConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

  currentConfig.appName = config.appName;
  currentConfig.appId = config.packageName;

  writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
  log(`✅ 已更新 capacitor.config.json`, colors.green);
}

function updateBuildGradle(config) {
  const gradlePath = join(__dirname, 'android', 'app', 'build.gradle');
  let content = readFileSync(gradlePath, 'utf-8');

  content = content.replace(/applicationId\s+"[^"]+"/, `applicationId "${config.packageName}"`);

  writeFileSync(gradlePath, content);
  log(`✅ 已更新 build.gradle`, colors.green);
}

function updateManifest(config) {
  const manifestPath = join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  let content = readFileSync(manifestPath, 'utf-8');

  content = content.replace(/android:label="[^"]+"/, `android:label="${config.appName}"`);

  writeFileSync(manifestPath, content);
  log(`✅ 已更新 AndroidManifest.xml`, colors.green);

  const stringsPath = join(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  let stringsContent = readFileSync(stringsPath, 'utf-8');

  stringsContent = stringsContent.replace(/<string name="app_name">[^<]+<\/string>/, `<string name="app_name">${config.appName}</string>`);
  stringsContent = stringsContent.replace(/<string name="title_activity_main">[^<]+<\/string>/, `<string name="title_activity_main">${config.appName}</string>`);

  writeFileSync(stringsPath, stringsContent);
  log(`✅ 已更新 strings.xml`, colors.green);
}

function checkConfig() {
  const configPath = join(__dirname, 'src', 'config.js');
  if (!existsSync(configPath)) {
    log('❌ 错误: src/config.js 不存在', colors.red);
    log('请创建 config.js 文件并配置后端地址', colors.yellow);
    return false;
  }

  const configContent = readFileSync(configPath, 'utf-8');
  if (configContent.includes('your-backend-url.com')) {
    log('⚠️  警告: config.js 中的后端地址还是默认值', colors.yellow);
    log('请修改 src/config.js 中的 API_BASE_URL', colors.yellow);
  }

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const buildType = args.includes('--release') ? 'release' : 'debug';

  log('=========================================', colors.bright);
  log('  ChatterBox Android 构建脚本', colors.bright);
  log('=========================================', colors.bright);
  log(`\n构建类型: ${buildType === 'release' ? '发布版' : '调试版'}`, colors.yellow);

  const userConfig = await getUserConfig();

  updateCapacitorConfig(userConfig);
  updateBuildGradle(userConfig);
  updateManifest(userConfig);

  if (!checkConfig()) {
    process.exit(1);
  }

  if (!runCommand('npm run build', '构建前端')) {
    process.exit(1);
  }

  if (!runCommand('npx cap sync android', '同步到 Android')) {
    process.exit(1);
  }

  const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const task = buildType === 'release' ? 'assembleRelease' : 'assembleDebug';

  if (!runCommand(`cd android && ${gradlewCmd} ${task}`, `构建 ${buildType === 'release' ? '发布版' : '调试版'} APK`)) {
    process.exit(1);
  }

  log('\n=========================================', colors.bright);
  log('  ✅ 构建成功！', colors.green);
  log('=========================================', colors.bright);

  const apkPath = buildType === 'release'
    ? join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
    : join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

  log(`\nAPK 位置: ${apkPath}`, colors.green);
  log('\n安装命令:', colors.blue);
  log(`adb install "${apkPath}"`, colors.reset);
}

main();
