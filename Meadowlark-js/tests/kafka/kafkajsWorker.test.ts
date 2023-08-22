// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-console */
import axios from 'axios';
import { faker } from '@faker-js/faker';

import {
  initialize as kafkaInitialize,
  subscribeToReadEachMessageFromTopic,
  getCountMessages,
  subscribeToReadMessagesFromBatch,
  closeConnection as kafkaCloseConnection,
} from './kafkajs-worker/kafkajsWorker';

const URL_PREFIX = 'http://localhost:3000';

jest.setTimeout(100000);

async function getBearerToken(urlPrefix: string): Promise<string> {
  // Authenticate hardcoded admin
  const authenticateAdminResult = await axios.post(
    `${urlPrefix}/local/oauth/token`,
    {
      grant_type: 'client_credentials',
      client_id: 'meadowlark_admin_key_1',
      client_secret: 'meadowlark_admin_secret_1',
    },
    {
      headers: { 'content-type': 'application/json' },
    },
  );

  return authenticateAdminResult.data.access_token;
}

describe('when sending a post to descriptors to read kafka each message', () => {
  beforeAll(async () => {
    // Add a different group Id
    const groupId = `kafkajsGroup-${faker.number.int()}`;
    await kafkaInitialize(groupId);
    await subscribeToReadEachMessageFromTopic(groupId, false);
  });
  afterAll(async () => {
    await kafkaCloseConnection();
  });
  it('should read each message from topic', async () => {
    const bearerToken: string = await getBearerToken(URL_PREFIX);
    const descriptorVariation = faker.number.int();
    // Create educationOrganizationCategoryDescriptors
    await axios.post(
      `${URL_PREFIX}/local/v3.3b/ed-fi/educationOrganizationCategoryDescriptors`,
      {
        codeValue: `Other KAFKA-${descriptorVariation}`,
        shortDescription: `Other KAFKA-${descriptorVariation}`,
        description: `Other KAFKA-${descriptorVariation}`,
        namespace: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor',
      },
      {
        headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
      },
    );
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((f) => setTimeout(f, 5000));
    const readResult = getCountMessages();
    expect(readResult > 0).toBeTruthy();
    await kafkaCloseConnection();
  });
});

describe('when sending a post to descriptors to read kafka batch message', () => {
  beforeAll(async () => {
    // Add a different group Id
    const groupId = `kafkajsGroup-${faker.number.int()}`;
    await kafkaInitialize(groupId);
    await subscribeToReadMessagesFromBatch(groupId, false);
  });
  afterAll(async () => {
    await kafkaCloseConnection();
  });
  it('should read batch message from topic', async () => {
    const bearerToken: string = await getBearerToken(URL_PREFIX);
    const descriptorVariation = faker.number.int();
    // Create educationOrganizationCategoryDescriptors
    await axios.post(
      `${URL_PREFIX}/local/v3.3b/ed-fi/educationOrganizationCategoryDescriptors`,
      {
        codeValue: `Other KAFKA-${descriptorVariation}`,
        shortDescription: `Other KAFKA-${descriptorVariation}`,
        description: `Other KAFKA-${descriptorVariation}`,
        namespace: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor',
      },
      {
        headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
      },
    );
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((f) => setTimeout(f, 5000));
    const readResult = getCountMessages();
    expect(readResult > 0).toBeTruthy();
    await kafkaCloseConnection();
  });
});
