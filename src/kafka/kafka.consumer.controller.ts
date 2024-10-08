import { Controller, OnModuleInit } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaConsumerController implements OnModuleInit {
  onModuleInit() {
    console.log('Kafka Consumer Initialized');
  }

  @EventPattern('test') // Listening for messages on the 'test' topic
  async handleMessage(@Payload() message: any) {
    // Log the received message
    console.log('Received message test:', message.value); // Access the message value
  }

  @MessagePattern('test') // Listening for messages on the 'test' topic
  async handleMessage2(@Payload() message: any) {
    // Log the received message
    console.log('Received message test:', message.value); // Access the message value
  }
}
