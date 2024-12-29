import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClassifiedPacket, UnclassifiedPacket } from './types';
import { trainData } from './helpers/traindata';
import { classifyKNN } from './helpers/classifyKNN';
import { PcapParsedPacket } from 'src/common/types/pcap.models';

@Injectable()
export class KnnService implements OnModuleInit {
  private trainingData: ClassifiedPacket[] = [];
  private k: number = 3;

  onModuleInit() {
    this.trainingData = trainData;

    this.normalizeTrainingData();
  }

  private minMax = {
    dataLength: { min: Infinity, max: -Infinity },
    caplen: { min: Infinity, max: -Infinity },
    dport: { min: Infinity, max: -Infinity },
    sport: { min: Infinity, max: -Infinity },
  };

  private normalizeTrainingData() {
    console.log('Normalizing training data');
    const features = ['dataLength', 'caplen', 'dport', 'sport'];
    const minMax = {
      dataLength: { min: Infinity, max: -Infinity },
      caplen: { min: Infinity, max: -Infinity },
      dport: { min: Infinity, max: -Infinity },
      sport: { min: Infinity, max: -Infinity },
    };

    this.trainingData.forEach((packet) => {
      features.forEach((feature) => {
        if (packet[feature] < minMax[feature].min) {
          minMax[feature].min = packet[feature];
        }
        if (packet[feature] > minMax[feature].max) {
          minMax[feature].max = packet[feature];
        }
      });
    });

    this.trainingData = this.trainingData.map((packet) => {
      const normalizedPacket: ClassifiedPacket = { ...packet };
      features.forEach((feature) => {
        normalizedPacket[feature] =
          (packet[feature] - minMax[feature].min) /
          (minMax[feature].max - minMax[feature].min);
      });
      return normalizedPacket;
    });
  }

  private normalizePacket(packet: PcapParsedPacket): UnclassifiedPacket {
    const rawValues: UnclassifiedPacket = {
      dataLength: packet.len ?? 0,
      caplen: packet.caplen ?? 0,
      dport: packet.ethernetPayload?.ipPayload?.transportPayload.dport ?? 0,
      sport: packet.ethernetPayload?.ipPayload?.transportPayload.sport ?? 0,
    };

    const normalized: UnclassifiedPacket = { ...rawValues };

    (Object.keys(this.minMax) as (keyof typeof this.minMax)[]).forEach(
      (feature) => {
        const range = this.minMax[feature].max - this.minMax[feature].min || 1;
        normalized[feature] =
          (rawValues[feature] - this.minMax[feature].min) / range;
      },
    );

    return normalized;
  }

  public classify(packet: PcapParsedPacket): 'normal' | 'malicious' {
    const normalizedPacket = this.normalizePacket(packet);

    return classifyKNN(this.trainingData, normalizedPacket, this.k);
  }
}
