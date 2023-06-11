import { Client } from '@elastic/elasticsearch';

describe('When querying for documents', () => {
  let client: Client;

  it('should return value', async () => {
    const clientOpts = {
      node: 'http://localhost:9200',
      requestTimeout: 10000,
    };

    client = new Client(clientOpts);

    await client.index({
      index: 'game-of-thrones',
      body: {
        info: {
          character: 'Ned Stark',
          quote: 'Winter is coming.',
          house: 'stark',
        },
      },
    });

    await client.index({
      index: 'game-of-thrones',
      body: {
        info: {
          character: 'Arya Stark',
          quote: "A girl is Arya Stark of Winterfell. And I'm going home.",
          house: 'stark',
        },
      },
    });

    await client.index({
      index: 'game-of-thrones',
      refresh: true,
      body: {
        info: {
          character: 'Tyrion Lannister',
          quote: 'A Lannister always pays his debts.',
          house: 'lannister',
        },
      },
    });

    const result = await client.sql.query({
      // eslint-disable-next-line prettier/prettier
      query: "SELECT * FROM \"game-of-thrones\" WHERE info.house='stark'"

      // eslint-disable-next-line prettier/prettier
      // query: "SELECT * FROM \"game-of-thrones\""
    });

    const data = result.rows.map((row) => {
      const obj = {};
      for (let i = 0; i < row.length; i += 1) {
        if (result != null && result.columns != null) obj[result.columns[i].name] = row[i];
      }
      return obj;
    });

    expect(data.length).toBe(2);
  });
});
