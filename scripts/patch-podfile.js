const fs = require('fs');
const path = require('path');

const podfile = path.join(__dirname, '..', 'ios', 'Podfile');

if (!fs.existsSync(podfile)) {
  console.log('[patch-podfile] Podfile not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(podfile, 'utf8');

if (/FOLLY_HAS_COROUTINES/.test(content)) {
  console.log('[patch-podfile] already patched, skipping');
  process.exit(0);
}

const lines = content.split('\n');
let postInstallStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (/post_install\s+do\s+\|installer\|/.test(lines[i])) {
    postInstallStart = i;
    break;
  }
}

if (postInstallStart === -1) {
  console.log('[patch-podfile] WARNING: post_install block not found');
  process.exit(0);
}

let depth = 1;
let closeLine = -1;

for (let i = postInstallStart + 1; i < lines.length; i++) {
  const line = lines[i];
  const doMatch = line.match(/\bdo\b(?:\s*\|[^|]*\|)?/g);
  const endMatch = line.match(/^\s*end\s*$/);

  if (doMatch) depth += doMatch.length;
  if (endMatch) depth -= 1;

  if (depth === 0) {
    closeLine = i;
    break;
  }
}

if (closeLine === -1) {
  console.log('[patch-podfile] WARNING: could not find closing end of post_install');
  process.exit(0);
}

const insert = [
  "  installer.pods_project.targets.each do |target|",
  "    target.build_configurations.each do |config|",
  "      config.build_settings['SWIFT_VERSION'] = '5.9'",
  "      config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'",
  "      # RN 0.81: folly/coro/Coroutine.h doesn't exist. Any pod that includes",
  "      # Folly headers (Reanimated, Fabric, etc.) needs this to skip the include.",
  "      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']",
  "      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'",
  "      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'",
  "    end",
  "  end",
];

lines.splice(closeLine, 0, ...insert);
fs.writeFileSync(podfile, lines.join('\n'));
console.log('[patch-podfile] Added Swift 5.9, EXCLUDED_ARCHS, Folly coroutine fix');
