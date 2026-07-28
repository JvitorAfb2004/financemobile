const fs = require('fs');
const path = require('path');

const podfile = path.join(__dirname, '..', 'ios', 'Podfile');

if (!fs.existsSync(podfile)) {
  console.log('[patch-podfile] Podfile not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(podfile, 'utf8');
let changed = false;

if (!/use_frameworks!/.test(content)) {
  content = content.replace(
    /^(platform :ios.*)$/m,
    "$1\nuse_frameworks! :linkage => :static"
  );
  changed = true;
  console.log('[patch-podfile] Added use_frameworks! :linkage => :static');
}

if (!/config\.build_settings\['SWIFT_VERSION'\]/.test(content)) {
  const lines = content.split('\n');
  let postInstallStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/post_install\s+do\s+\|installer\|/.test(lines[i])) {
      postInstallStart = i;
      break;
    }
  }

  if (postInstallStart !== -1) {
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

    if (closeLine !== -1) {
      const insert = [
        "  installer.pods_project.targets.each do |target|",
        "    target.build_configurations.each do |config|",
        "      config.build_settings['SWIFT_VERSION'] = '5.9'",
        "      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'",
        "    end",
        "  end",
      ];

      lines.splice(closeLine, 0, ...insert);
      content = lines.join('\n');
      changed = true;
      console.log('[patch-podfile] Added SWIFT_VERSION + deployment target');
    } else {
      console.log('[patch-podfile] WARNING: could not find closing end of post_install');
    }
  } else {
    console.log('[patch-podfile] WARNING: post_install block not found');
  }
}

if (changed) {
  fs.writeFileSync(podfile, content);
  console.log('[patch-podfile] Podfile updated');
} else {
  console.log('[patch-podfile] No changes needed');
}
