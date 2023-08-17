import { Consumer, Kafka, KafkaConfig } from 'kafkajs';

const moduleName = 'kafkajs-worker.kafkaWorker';
const topic = 'edfi.meadowlark.documents';

const kafkaConfig: KafkaConfig = {
  clientId: 'meadowlark-kafkajs',
  brokers: ['kafka1:9092'],
};

let consumerClient: Consumer | null = null;

/**
 * Create and return an KAFKA connection object
 */
export async function getNewClient(groupId: string): Promise<Consumer> {
  const kafka = new Kafka(kafkaConfig);
  return kafka.consumer({ groupId });
}

/**
 * Return the client
 */
export async function getClient(groupId: string): Promise<Consumer> {
  if (consumerClient == null) {
    consumerClient = await getNewClient(groupId);
    await consumerClient.connect();
  }
  return consumerClient;
}

export async function subscribeTopic(groupId: string): Promise<void> {
  if (consumerClient == null) {
    consumerClient = await getClient(groupId);
  }
  console.log(`${moduleName}.subscribeTopic Add subscription to Topic`, '');
  await consumerClient.subscribe({ topic, fromBeginning: false });
}

export async function readFromTopic(groupId: string): Promise<void> {
  await consumerClient?.run({
    eachMessage: async ({ message }) => {
      console.log('#_____________________________________________________________________________#\n');
      console.log(`${moduleName} - GroupId (${groupId}).readMessagesFromBatch message: ${message?.value?.toString()}`);
      console.log('********************************************************************************\n');
    },
  });
}

(async () => {
  await subscribeTopic('Kafkajs-Group-01');
  await readFromTopic('Kafkajs-Group-01');
})();
