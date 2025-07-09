import ngrok from 'ngrok';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    // Start the Express server
    const server = spawn('node', ['src/server.js'], {
      stdio: 'inherit',
      shell: true
    });

    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start ngrok tunnel
    const url = await ngrok.connect({
      addr: 3000,
      proto: 'http'
    });

    console.log('\n----------------------------------------');
    console.log('🚀 Server is running!');
    console.log('📡 Local URL: http://localhost:3000');
    console.log(`🌍 Public URL: ${url}`);
    console.log('----------------------------------------\n');
    console.log('Webhook Endpoints:');
    console.log(`${url}/api/webhooks/blog/new     - For new posts`);
    console.log(`${url}/api/webhooks/blog/publish - For published posts`);
    console.log(`${url}/api/webhooks/blog/update  - For updated posts`);
    console.log('----------------------------------------\n');

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await ngrok.kill();
      server.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 