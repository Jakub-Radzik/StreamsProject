const fs = require('fs');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNormalDnsPackets(count) {
  const packets = [];

  for (let i = 0; i < count / 2; i++) {
    // Generowanie normalnych zapytań DNS
    const queryPacket = {
      dataLength: getRandomInt(50, 150), // Typowa długość danych dla zapytania DNS
      dport: 53, // Port docelowy dla DNS
      sport: getRandomInt(49152, 65535), // Ephemeral port źródłowy
      label: 'normal',
    };
    packets.push(queryPacket);

    // Generowanie normalnych odpowiedzi DNS
    const responsePacket = {
      dataLength: getRandomInt(100, 200), // Typowa długość danych dla odpowiedzi DNS
      dport: queryPacket.sport, // Port docelowy odpowiada portowi źródłowemu zapytania
      sport: 53, // Port źródłowy dla DNS
      label: 'normal',
    };
    packets.push(responsePacket);
  }

  return packets;
}

function generateMaliciousDnsPackets(count) {
  const packets = [];

  for (let i = 0; i < count; i++) {
    const maliciousPacket = {
      dataLength: getRandomInt(40, 100), // Długość danych może być mniejsza dla zapytań
      dport: 53, // Port docelowy dla DNS
      sport: 53, // Port źródłowy ustawiony na 53 dla ataków amplifikacyjnych
      label: 'malicious',
    };
    packets.push(maliciousPacket);
  }

  return packets;
}

function savePacketsToFile(filename, packets) {
  fs.writeFileSync(filename, JSON.stringify(packets, null, 2), 'utf8');
  console.log(`Zapisano ${packets.length} pakietów do pliku ${filename}`);
}

function main() {
  const normalCount = 100; // Liczba normalnych pakietów DNS (zapytania + odpowiedzi)
  const maliciousCount = 100; // Liczba złośliwych pakietów DNS Amplification

  const normalDnsPackets = generateNormalDnsPackets(normalCount);
  const maliciousDnsPackets = generateMaliciousDnsPackets(maliciousCount);

  console.log(maliciousDnsPackets);
}

main();
