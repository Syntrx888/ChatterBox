const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

console.log('========================================');
console.log('  ChatterBox 配置向导');
console.log('========================================');
console.log('');

async function main() {
  try {
    console.log('========================================');
    console.log('  第一步：安装依赖');
    console.log('========================================');
    console.log('');

    console.log('📦 正在安装前端依赖...');
    try {
      execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
      console.log('✅ 前端依赖安装完成');
    } catch (error) {
      console.error('❌ 前端依赖安装失败');
      rl.close();
      process.exit(1);
    }

    console.log('');
    console.log('📦 正在安装后端依赖...');
    try {
      execSync('npm install', { cwd: path.join(__dirname, 'server'), stdio: 'inherit' });
      console.log('✅ 后端依赖安装完成');
    } catch (error) {
      console.error('❌ 后端依赖安装失败');
      rl.close();
      process.exit(1);
    }

    console.log('');
    console.log('========================================');
    console.log('  第二步：配置项目');
    console.log('========================================');
    console.log('');

    const API_BASE_URL = (await question('请输入后端服务器地址（例如：http://localhost:3000）: ')) || 'http://localhost:3000';
    const normalizedApiUrl = API_BASE_URL.replace(/\/+$/, '');

    const chatRoomName = (await question('请输入聊天室名称: ')) || 'ChatterBox';

    const faviconUrl = await question('请输入网站图标 URL（留空使用默认图标）: ');

    const defaultAvatar = await question('请输入默认头像 URL（留空使用系统默认头像）: ');

    const enableInviteCodeInput = await question('是否启用邀请码功能？(y/n): ');
    const enableInviteCode = enableInviteCodeInput.toLowerCase() === 'y';

    let inviteCodes = [];
    if (enableInviteCode) {
      console.log('');
      console.log('请输入邀请码（每行一个，输入空行结束）：');
      
      while (true) {
        const code = await question('> ');
        if (!code || code.trim() === '') {
          break;
        }
        inviteCodes.push(code.trim());
      }
      
      if (inviteCodes.length === 0) {
        console.log('未输入任何邀请码，邀请码功能将禁用。');
      }
    }

    console.log('');
    console.log('========================================');
    console.log('  配置确认');
    console.log('========================================');
    console.log('');
    console.log(`后端服务器地址: ${normalizedApiUrl}`);
    console.log(`聊天室名称: ${chatRoomName}`);
    console.log(`网站图标: ${faviconUrl || '（使用默认）'}`);
    console.log(`默认头像: ${defaultAvatar || '（使用默认）'}`);
    console.log(`启用邀请码: ${enableInviteCode ? '是' : '否'}`);
    if (enableInviteCode && inviteCodes.length > 0) {
      console.log(`邀请码数量: ${inviteCodes.length}`);
    }

    const confirm = await question('确认以上配置？(Y/n): ') || 'Y';
    if (confirm.toLowerCase() !== 'y') {
      console.log('');
      console.log('配置已取消。');
      rl.close();
      process.exit(0);
    }

    console.log('');
    console.log('========================================');
    console.log('  第三步：应用配置');
    console.log('========================================');
    console.log('');

    console.log('📝 配置前端...');
    const frontendConfig = `const API_BASE_URL = '${normalizedApiUrl}';

export default {
  API_BASE_URL: API_BASE_URL.replace(/\\/+$/, ''),
  chatRoomName: '${chatRoomName}',
  faviconUrl: '${faviconUrl}',
  defaultAvatar: '${defaultAvatar}',
  enableInviteCode: ${enableInviteCode}
}
`;
    fs.writeFileSync(path.join(__dirname, 'client', 'src', 'config.js'), frontendConfig, 'utf8');
    console.log('✅ 前端配置完成');

    console.log('');
    console.log('📝 配置后端...');
    const inviteCodesArray = JSON.stringify(inviteCodes);
    const backendConfig = `module.exports = {
  port: 3000,
  host: '0.0.0.0',
  jwtSecret: 'chatterbox-secret-key-2024',
  enableInviteCode: ${enableInviteCode},
  inviteCodes: ${inviteCodesArray}
}
`;
    fs.writeFileSync(path.join(__dirname, 'server', 'config.js'), backendConfig, 'utf8');
    console.log('✅ 后端配置完成');

    console.log('');
    console.log('========================================');
    console.log('  第四步：打包前端');
    console.log('========================================');
    console.log('');

    console.log('🔨 正在打包前端...');
    try {
      execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
      console.log('✅ 前端打包完成');
    } catch (error) {
      console.error('❌ 前端打包失败');
      rl.close();
      process.exit(1);
    }

    console.log('');
    console.log('========================================');
    console.log('  配置完成！');
    console.log('========================================');
    console.log('');
    console.log('前端打包后的文件位于: client/dist/');
    console.log('后端配置文件位于: server/config.js');
    console.log('');
    console.log('启动后端服务器：');
    console.log('  cd server');
    console.log('  npm start');
    console.log('');
    console.log('部署前端：');
    console.log('  将 client/dist/ 目录中的文件部署到您的 Web 服务器');
    console.log('');

    rl.close();
  } catch (error) {
    console.error('配置过程中发生错误:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
