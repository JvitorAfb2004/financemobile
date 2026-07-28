const fs = require('fs');
const path = require('path');

const podfile = path.join(__dirname, '..', 'ios', 'Podfile');

if (!fs.existsSync(podfile)) {
  console.log('[patch-podfile] Podfile not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(podfile, 'utf8');

content = content.replace(
  /^(platform :ios.*)$/m,
  "$1\nuse_frameworks! :linkage => :static"
);

content = content.replace(
  /(react_native_post_install\(installer\).*?\n)/s,
  "$1" +
  "  installer.pods_project.targets.each do |target|\n" +
  "    target.build_configurations.each do |config|\n" +
  "      config.build_settings['SWIFT_VERSION'] = '5.9'\n" +
  "    end\n" +
  "  end\n"
);

fs.writeFileSync(podfile, content);
console.log('[patch-podfile] Podfile updated');
