import app from './app.js';
import { getLocalIpAddresses } from './utils/network.js';

const PORT = process.env.PORT || 3001;

// Bind to 0.0.0.0 (All local interfaces)
app.listen(PORT, '0.0.0.0', () => {
  const ipList = getLocalIpAddresses();
  console.log('\n=============================================================');
  console.log('       ⚓ GRAPNEL LAN FILE SERVER IS ACTIVE & RUNNING         ');
  console.log('=============================================================');
  console.log(` Server bound to: 0.0.0.0:${PORT}`);
  console.log(` Local access:    http://localhost:${PORT}`);
  
  if (ipList.length > 0) {
    console.log('\n📱 LAN Client Access Links (Open on Phone/Browser):');
    ipList.forEach(({ interface: iface, ip }) => {
      console.log(`   ➜ ${iface}: http://${ip}:3000`);
    });
  } else {
    console.log('\n⚠️ No active non-internal IPv4 interfaces found.');
  }
  console.log('=============================================================\n');
});
