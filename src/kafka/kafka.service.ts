import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Kafka, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService {
  private readonly kafka = new Kafka({
    clientId: 'test-consumer',
    brokers: ['localhost:9092'],
  });

  async onModuleInit() {
    const admin = this.kafka.admin();
    await admin.connect();

    const topic = 'test'; // Replace with your topic name
    const topics = await admin.listTopics();

    if (!topics.includes(topic)) {
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: 1, // Define the number of partitions as needed
            replicationFactor: 1, // Set the replication factor according to your setup
          },
        ],
      });
      console.log(`Topic "${topic}" created.`);
    } else {
      console.log(`Topic "${topic}" already exists.`);
    }

    await admin.disconnect();

    const consumer = this.kafka.consumer({ groupId: 'test-consumer' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'test', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const jsonMessage = JSON.parse(message.value.toString());
        console.log('Received message:', jsonMessage);
      },
    });
  }
}
