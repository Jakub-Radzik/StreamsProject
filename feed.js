const pcap = require('pcap');
const { Kafka } = require('kafkajs');

// const pcapFilePath = './today.pcap';
const pcapFilePath = './port_scan_from_192.168.1.69_to_192.168.1.4.pcap';

const kafka = new Kafka({
  clientId: 'my-kafka-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

producer
  .connect()
  .then(run)
  .catch((err) => {
    console.error('Failed to connect to Kafka:', err);
  });

async function run() {
  const pcapSession = pcap.createOfflineSession(pcapFilePath, 'ip');

  pcapSession.on('packet', async (rawPacket) => {
    const packet = pcap.decode.packet(rawPacket);

    try {
      await producer.send({
        topic: 'pcap',
        messages: [
          {
            value: JSON.stringify(packet),
          },
        ],
      });
      console.log('Packet sent to Kafka.');
    } catch (error) {
      console.error('Error sending packet to Kafka:', error);
    }
  });

  pcapSession.on('complete', async () => {
    console.log('Finished reading PCAP file.');
    console.log('Kafka producer disconnected.');
  });

  pcapSession.on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });

  console.log(`Starting to read PCAP file: ${pcapFilePath}`);
}
