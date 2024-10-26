const fs = require('fs');
const { Kafka } = require('kafkajs');
const PCAPNGParser = require('pcap-ng-parser');

// const pcapFile = './sample.pcapng';
// const pcapFile = './port_scan.pcapng';
const pcapFile = './port_scan_from_192.168.1.69_to_192.168.1.4.pcapng';

const kafka = new Kafka({
  clientId: 'my-kafka-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function run() {
  try {
    await producer.connect();
    console.log('Producer connected');

    const parser = new PCAPNGParser();
    const myFileStream = fs.createReadStream(pcapFile);

    myFileStream
      .on('data', (chunk) => {
        parser.write(chunk);
      })
      .on('end', () => {
        console.log('File read complete.');
        parser.end();
      });

    parser
      .on('data', async (parsedPacket) => {
        try {
          await producer.send({
            topic: 'test',
            messages: [
              {
                value: JSON.stringify(parsedPacket),
              },
            ],
          });
        } catch (sendError) {
          console.error('Error sending packet:', sendError);
        }
      })
      .on('interface', (interfaceInfo) => {
        console.log('Interface Info:', interfaceInfo);
      })
      .on('error', (error) => {
        console.error('Parser error:', error);
      })
      .on('end', async () => {
        console.log('Parsing complete.');
        await producer.disconnect();
        console.log('Producer disconnected');
      });
  } catch (error) {
    console.error('Error running Kafka producer:', error);
    await producer.disconnect();
  }
}

run().catch(console.error);
