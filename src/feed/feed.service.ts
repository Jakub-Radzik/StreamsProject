import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedService {
  constructor(private readonly configService: ConfigService) {}

  runScript() {
    console.log(process.env.QUEUE_URL);
    console.log(this.configService.get<string>('QUEUE_URL'));
    console.log(this.configService.get<string>('QUEUE_NAME'));
    // Logika skryptu wysyłającego dane
  }
}
