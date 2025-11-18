const { exec } = require('child_process');
const fs = require('fs');

// Check if build directory exists
if (!fs.existsSync('./dist')) {
  console.log('Creating dist directory...');
  fs.mkdirSync('./dist');
}

// Run build command
console.log('Running build command...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('Build failed:');
    console.error(stderr);
    
    // Common issues
    if (stderr.includes('command not found')) {
      console.log('\n⚠️  Solution: Install dependencies with "npm install"');
    }
    if (stderr.includes('Module not found')) {
      console.log('\n⚠️  Solution: Check your import paths and dependencies');
    }
    return;
  }
  
  console.log('✅ Build successful!');
  console.log(stdout);
  
  // Verify build output
  const files = fs.readdirSync('./dist');
  console.log(`📁 Built ${files.length} files in dist folder`);
});
