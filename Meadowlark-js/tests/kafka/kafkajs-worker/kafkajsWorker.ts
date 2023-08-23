/* eslint-disable no-console */
import { Consumer, Kafka, KafkaConfig } from 'kafkajs';

const moduleName = 'kafkajs-worker.kafkaWorker';
const topicToRead = 'edfi.meadowlark.documents';
let consumerClient: Consumer | null = null;
// eslint-disable-next-line prefer-const
let subscriptionActive: boolean = false;
// eslint-disable-next-line prefer-const
let result: any = [];

/**
 * Create and return an Kafkajs consumer object for the groupId
 */
async function getNewClient(groupId: string): Promise<Consumer> {
  const kafkaConfig: KafkaConfig = {
    clientId: 'meadowlark-kafkajs',
    brokers: ['kafka1:9092'],
  };
  const kafka = new Kafka(kafkaConfig);
  return kafka.consumer({ groupId });
}

/**
 * Return the Kafka consumer client connection.
 */
async function getClient(groupId: string): Promise<Consumer> {
  if (consumerClient == null) {
    consumerClient = await getNewClient(groupId);
    await consumerClient.connect();
  }
  return consumerClient;
}

/**
 * Close kafka connection
 */
export async function closeConnection(): Promise<void> {
  if (consumerClient != null) {
    await consumerClient.disconnect();
  }
  consumerClient = null;
  result = [];
  subscriptionActive = false;
  console.log(`Module ${moduleName} Kafka connection: closed`, null);
}

/**
 * eachBatch handler will feed your function batches and provide some utility functions to give your code more
 * flexibility: resolveOffset, heartbeat, commitOffsetsIfNecessary, uncommittedOffsets, isRunning, isStale,
 * and pause. All resolved offsets will be automatically committed after the function is executed.
 * You will have to understand how session timeouts and heartbeats are connected
 * @param groupId
 * @returns
 */
export async function subscribeToReadMessagesFromBatch(groupId: string, printToConsole: Boolean = true): Promise<void> {
  if (subscriptionActive) {
    return;
  }
  if (printToConsole) {
    console.log('@ Batch @');
  }
  // Create subscription
  await consumerClient?.subscribe({ topic: topicToRead, fromBeginning: true });
  subscriptionActive = true;
  await consumerClient?.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
      if (printToConsole) {
        // eslint-disable-next-line no-restricted-syntax
        console.log('======================================================================\n');
      }
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      batch.messages.forEach(async (message): Promise<void> => {
        if (!isRunning() || isStale()) {
          return;
        }
        if (printToConsole) {
          console.log(
            `${moduleName}- GroupId (${groupId}).subscribeToReadMessagesFromBatch\n - key: ${message?.key?.toString()}\n - Offset: ${message?.offset?.toString()}\n - Timestamp: ${message?.timestamp?.toString()}\n - message: ${message?.value?.toString()}`,
          );
        }
        result.push(1);
        // Mark a message in the batch as processed.
        // In case of errors, the consumer will automatically commit the resolved offsets.
        resolveOffset(message?.offset);
        // It can be used to send heartbeat to the broker according to the set
        await heartbeat();
      });
      if (printToConsole) {
        console.log('==========**************************************************==========\n');
      }
    },
    partitionsConsumedConcurrently: 1,
  });
}

/**
 * Read from topic using eachMessageFunction
 * eachMessageFunction: It is implemented on top of eachBatch, and it will automatically commit
 * your offsets and heartbeat at the configured interval.
 * @param groupId
 */
export async function subscribeToReadEachMessageFromTopic(groupId: string, printToConsole: Boolean = true): Promise<void> {
  if (subscriptionActive) {
    return;
  }
  if (printToConsole) {
    console.log('@ Each Message @');
  }
  await consumerClient?.subscribe({ topic: topicToRead, fromBeginning: true });
  subscriptionActive = true;
  await consumerClient?.run({
    // eslint-disable-next-line no-unused-vars
    eachMessage: async ({ message, heartbeat }) => {
      if (printToConsole) {
        console.log('#_____________________________________________________________________________#\n');
        console.log(
          `${moduleName} - GroupId (${groupId}).readFromTopic\n - key: ${message?.key?.toString()}\n - Timestamp: ${message?.timestamp?.toString()}\n - message: ${message?.value?.toString()}`,
        );
        console.log('********************************************************************************\n');
      }
      result.push(1);
      if (message) {
        await heartbeat();
      }
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGINT', async () => {
  console.log('Terminating...');
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('exit', async (): Promise<void> => {
  console.log('Closing...');
  await closeConnection();
});

export async function initialize(groupId) {
  result = [];
  subscriptionActive = false;
  consumerClient = await getClient(groupId);
}
export function getCountMessages() {
  return result.length ?? 0;
}

(async () => {
  console.log(`º Start Kafkajs client º`);
  const groupId = process.argv[2] ?? 'Kafkajs-Group';
  const batch = process.argv[3] ?? '';
  await initialize(groupId);
  if (batch.toLowerCase() === 'batch') {
    await subscribeToReadMessagesFromBatch(groupId);
  } else {
    await subscribeToReadEachMessageFromTopic(groupId);
  }
})();
