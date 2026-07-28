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
  const insert = [
    "  installer.pods_project.targets.each do |target|",
    "    target.build_configurations.each do |config|",
    "      config.build_settings['SWIFT_VERSION'] = '5.9'",
    "      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'",
    "    end",
    "  end",
  ].join("\n");

  content = content.replace(
    /(post_install do \|installer\|)\n([\s\S]*?)(\nend\b)/,
    function (_, header, body, closer) {
      return header + "\n" + body + "\n" + insert + closer;
    }
  );
  changed = true;
  console.log('[patch-podfile] Added SWIFT_VERSION + deployment target');
}

if (changed) {
  fs.writeFileSync(podfile, content);
  console.log('[patch-podfile] Podfile updated');
} else {
  console.log('[patch-podfile] No changes needed');
}
