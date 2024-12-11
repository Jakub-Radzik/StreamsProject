import { ClassifiedPacket, UnclassifiedPacket } from '../types';
import { euclideanDistance } from './euclidanDistance';

export function classifyKNN(
  trainingData: ClassifiedPacket[],
  testPacket: UnclassifiedPacket,
  k: number,
): 'normal' | 'malicious' {
  const distances = trainingData.map((packet) => ({
    label: packet.label,
    distance: euclideanDistance(
      [packet.dataLength, packet.dport, packet.sport],
      [testPacket.dataLength, testPacket.dport, testPacket.sport],
    ),
  }));

  distances.sort((a, b) => a.distance - b.distance);

  const topK = distances.slice(0, k);

  const counts: { [key: string]: number } = {};
  topK.forEach((neighbor) => {
    counts[neighbor.label] = (counts[neighbor.label] || 0) + 1;
  });

  let maxCount = 0;
  let predictedLabel: 'normal' | 'malicious' = 'normal';
  for (const label in counts) {
    if (counts[label] > maxCount) {
      maxCount = counts[label];
      predictedLabel = label as 'normal' | 'malicious';
    }
  }

  return predictedLabel;
}
