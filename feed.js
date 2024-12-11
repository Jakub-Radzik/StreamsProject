const pcap = require('pcap');
const { Kafka } = require('kafkajs');

const prefixFiles = './data';
const fileNames = [
  'DNS_amplify_2.pcap',
  // 'ICMP_Flood.pcap',
  // 'SYN_Flood.pcap',
  // 'UDP_Flood.pcap',
  // 'port_scan_from_192.168.1.69_to_192.168.1.4.pcap',
];

const kafka = new Kafka({
  clientId: 'my-kafka-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const BATCH_SIZE = 100; // Maximum number of messages in a batch
let packetBatch = []; // Stores packets for the current batch
let packetCount = 0;

async function sendBatch(batch) {
  try {
    await producer.send({
      topic: 'pcap',
      messages: batch,
    });
    // console.log(`Sent ${batch.length} packets to Kafka.`);
  } catch (error) {
    console.error('Error sending batch to Kafka:', error);
  }
}

async function processPcapFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const pcapSession = pcap.createOfflineSession(filePath, 'ip');
      console.log(`Starting to read PCAP file: ${filePath}`);

      pcapSession.on('packet', async (rawPacket) => {
        try {
          const packet = pcap.decode.packet(rawPacket);
          packetBatch.push({
            value: JSON.stringify(packet),
          });
          packetCount++;

          // Send the batch if it reaches the defined size
          if (packetBatch.length >= BATCH_SIZE) {
            const batchToSend = packetBatch;
            packetBatch = []; // Reset batch
            await sendBatch(batchToSend);
          }
        } catch (error) {
          console.error('Error processing packet:', error);
        }
      });

      pcapSession.on('complete', async () => {
        console.log(`PCAP file read completed: ${filePath}`);

        // Send any remaining packets
        if (packetBatch.length > 0) {
          // console.log(`Sending remaining ${packetBatch.length} packets...`);
          await sendBatch(packetBatch);
        }

        console.log(
          `Finished reading PCAP file: ${filePath}. ${packetCount} packets processed.`,
        );
        resolve();
      });

      pcapSession.on('error', (err) => {
        console.error(`Error reading PCAP file (${filePath}): ${err.message}`);
        reject(err);
      });
    } catch (err) {
      console.error(`Failed to process PCAP file (${filePath}):`, err);
      reject(err);
    }
  });
}

async function run() {
  try {
    await producer.connect();

    for (const filePath of fileNames) {
      packetBatch = []; // Reset batch for each file
      packetCount = 0; // Reset packet count for each file
      const file = `${prefixFiles}/${filePath}`;
      console.log(`Processing file: ${file}`);

      await processPcapFile(file);
    }

    console.log('All files processed successfully.');
    await producer.disconnect();
  } catch (err) {
    console.error('Failed to process PCAP files:', err);
  }
}

// Run the process
run();
