import * as Kafka from 'node-rdkafka';

const moduleName = 'rdkafka-worker.rdkafkaWorker';
const topic = 'edfi.meadowlark.documents';
let consumerClient: Kafka.KafkaConsumer | null = null;

/**
 * Create and return an KAFKA connection object
 */
export async function getNewClient(groupId: string): Promise<Kafka.KafkaConsumer> {
  const consumer = new Kafka.KafkaConsumer(
    {
      'group.id': groupId,
      'metadata.broker.list': 'kafka1:9092',
    },
    {},
  );
  return consumer;
}

/**
 * Return the shared client
 */
export async function getClient(groupId: string): Promise<Kafka.KafkaConsumer> {
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
  consumerClient.on('ready', () => {
    consumerClient?.subscribe([topic]);
    consumerClient?.consume();
  });
  consumerClient.on('event.error', (err) => {
    console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n');
    console.log(`${moduleName} Error from consumer ${err}`);
    console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n');
  });
}

export async function readFromTopic(groupId: string): Promise<void> {
  consumerClient?.on('data', (data) => {
    console.log('*_____________________________________________________________________________*\n');
    console.log(`${moduleName} - GroupId (${groupId}).readFromTopic message: ${data?.value?.toString()}`);
    console.log('********************************************************************************\n');
  });
}

(async () => {
  console.log(`${moduleName}.Main start`, '');
  await subscribeTopic('rdkafkaWorker-Group-01');
  await readFromTopic('rdkafkaWorker-Group-01');
})();
