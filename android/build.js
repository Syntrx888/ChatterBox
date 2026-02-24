#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log('');
  log(`步骤 ${step}: ${message}`, colors.bright);
}

function runCommand(command, description) {
  try {
    log(`  → ${description}...`, colors.blue);
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    log(`  ✓ ${description}完成`, colors.green);
    return true;
  } catch (error) {
    log(`  ✗ ${description}失败`, colors.red);
    return false;
  }
}

function checkEnvironment() {
  logStep(1, '检查环境');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    log(`  ✓ Node.js 版本: ${nodeVersion}`, colors.green);
  } catch (error) {
    log('  ✗ 错误: Node.js 未安装', colors.red);
    process.exit(1);
  }

  try {
    const javaVersion = execSync('java -version 2>&1', { encoding: 'utf-8' }).split('\n')[0];
    log(`  ✓ Java 版本: ${javaVersion}`, colors.green);
  } catch (error) {
    log('  ✗ 错误: Java 未安装', colors.red);
    process.exit(1);
  }
}

function installDependencies() {
  logStep(2, '安装依赖');
  return runCommand('npm install', '依赖安装');
}

function initAndroidPlatform() {
  logStep(3, '初始化 Capacitor Android 平台');
  
  const androidDir = path.join(__dirname, 'android');
  if (!fs.existsSync(androidDir)) {
    return runCommand('npx cap add android', 'Android 平台初始化');
  } else {
    log('  ✓ Android 平台已存在', colors.green);
    return true;
  }
}

function buildFrontend() {
  logStep(4, '构建前端');
  return runCommand('npm run build', '前端构建');
}

function syncToAndroid() {
  logStep(5, '同步到 Android');
  return runCommand('npx cap sync android', '同步');
}

function buildAPK() {
  logStep(6, '构建 APK');
  
  const androidDir = path.join(__dirname, 'android');
  const gradlewPath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  
  if (!fs.existsSync(gradlewPath)) {
    log('  ✗ 错误: gradlew 不存在', colors.red);
    return false;
  }

  const gradlewCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  // 添加 -Pandroid.enableAapt2Daemon=false 禁用 AAPT2 Daemon 以解决 Windows 上的问题
  return runCommand(`cd android && ${gradlewCommand} assembleDebug -Pandroid.enableAapt2Daemon=false`, 'APK 构建');
}

async function main() {
  log('=========================================', colors.bright);
  log('  ChatterBox Android 一键配置打包脚本', colors.bright);
  log('=========================================', colors.bright);

  try {
    checkEnvironment();
    
    if (!installDependencies()) {
      process.exit(1);
    }

    if (!initAndroidPlatform()) {
      process.exit(1);
    }

    if (!buildFrontend()) {
      process.exit(1);
    }

    if (!syncToAndroid()) {
      process.exit(1);
    }

    if (!buildAPK()) {
      process.exit(1);
    }

    log('');
    log('=========================================', colors.bright);
    log('  构建成功！', colors.green);
    log('=========================================', colors.bright);
    log('');
    log('APK 位置:', colors.yellow);
    log('  android/app/build/outputs/apk/debug/app-debug.apk', colors.blue);
    log('');
  } catch (error) {
    log(`\n✗ 构建失败: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
