const pcap = require('pcap');
const { Kafka } = require('kafkajs');

const pcapFilePath = './big_1.pcap';

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
    console.log(`Sent ${batch.length} packets to Kafka.`);
  } catch (error) {
    console.error('Error sending batch to Kafka:', error);
  }
}

async function run() {
  try {
    await producer.connect();

    const pcapSession = pcap.createOfflineSession(pcapFilePath, 'ip');

    console.log(`Starting to read PCAP file: ${pcapFilePath}`);

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
      console.log('PCAP file read completed.');

      // Send any remaining packets
      if (packetBatch.length > 0) {
        console.log(`Sending remaining ${packetBatch.length} packets...`);
        await sendBatch(packetBatch);
      }

      console.log(
        `Finished reading PCAP file: ${packetCount} packets processed.`,
      );
      await producer.disconnect();
    });

    pcapSession.on('error', (err) => {
      console.error(`Error reading PCAP file: ${err.message}`);
    });
  } catch (err) {
    console.error('Failed to process PCAP file:', err);
  }
}

// Run the process
run();
