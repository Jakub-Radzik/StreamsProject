const { Kafka } = require('kafkajs');

async function run() {
  const kafka = new Kafka({
    clientId: 'my-kafka-producer',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer();

  await producer.connect();
  console.log('Producer connected');

  for (let i = 0; i < 100; i++) {
    const message = `Message ${i + 1}`; // Create a string message
    await producer.send({
      topic: 'test',
      messages: [
        { value: message }, // Send the message
      ],
    });
    console.log(`Sent: ${message}`);
  }

  await producer.disconnect();
  console.log('Producer disconnected');
}

run().catch(console.error);
