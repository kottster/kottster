import request from 'supertest'
import fs from 'fs';
import { sign } from 'jsonwebtoken';
import { createApp, createAdapter, getEnvOrThrow } from '../../lib'
import { KottsterApp } from '../../lib/core/app'
import { Server } from 'http';
import mock from 'mock-fs'
import { Adapter, AdapterType } from '../../lib/models/adapter.model';
import { PROJECT_DIR } from '../../lib/constants/projectDir';
import { Stage } from '../../lib/models/stage.model';
import { config } from 'dotenv'

const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

describe('app integration test', () => {
  config({ path: '.env.test.local' });
  
  let app: KottsterApp;
  let server: Server;
  let adapter: Adapter;
  
  const jwtToken = sign({ appId: 'foo' }, getEnvOrThrow('JWT_SECRET'));
  const jwtTokenWithBuilderRole = sign({ appId: 'foo', role: 'DEVELOPER' }, getEnvOrThrow('JWT_SECRET'));
  
  beforeAll(() => {
    app = createApp({
      appId: 'foo',
      secretKey: 'secret-key'
    });
    adapter = createAdapter(AdapterType.postgresql, {
      connectionOptions: {
        connection: getEnvOrThrow('POSTGRESQL_CONNECTION_STRING'),
        searchPath: ['public'],
      },
    });
    app.setAdapter(adapter);

    // Start the server
    server = app.start(9032);
  });

  afterAll(() => {
    server?.close();
    adapter?.destroyConnection();
  });

  beforeEach(() => {
    mock({});
  });
  
  afterEach(() => {
    mock.restore();
  });

  it('should return healthcheck data', async () => {
    const res = await request(server).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appId', 'foo');
  });

  it('should return error for executing action without token', async () => {
    const res = await request(server)
      .get('/action/setupAdapter',)
      .query({ 
        actionData: JSON.stringify({})
      });

    expect(res.status).toBe(401);
  });

  it('should return error for adapter setup', async () => {
    const res = await request(server)
      .get('/action/setupAdapter')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({ 
        actionData: JSON.stringify({
          type: 'postgresql',
          connectionOptions: {
            connection: 'postgres://invalid-host:5432/kottster',
            searchPath: ['public'],
          },
        })
      });

    expect(res.status).toBe(500);
    expect(res.body?.error).toBe('Failed to connect to the database: getaddrinfo ENOTFOUND invalid-host');
  });

  it('should setup adapter', async () => {
    const res = await request(server)
      .get('/action/setupAdapter')
      .set('Authorization', `Bearer ${jwtTokenWithBuilderRole}`)
      .query({ 
        actionData: JSON.stringify({
          type: 'postgresql',
          connectionOptions: {
            connection: getEnvOrThrow('POSTGRESQL_CONNECTION_STRING'),
            searchPath: ['public'],
          },
        })
      });

    expect(res.status).toBe(200);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(`${PROJECT_DIR}/src/adapters.js`, expect.stringContaining(getEnvOrThrow('POSTGRESQL_CONNECTION_STRING')));
  });

  it('should write procedures to file', async () => {
    const res = await request(server)
      .get('/action/setProcedures')
      .set('Authorization', `Bearer ${jwtTokenWithBuilderRole}`)
      .query({ 
        actionData: JSON.stringify({
          stage: 'dev',
          procedures: [
            {
              pageId: 'p1',
              componentType: 'metric',
              componentId: 'm1',
              procedureName: 'getTotalOrdersCount',
              functionBody: `async function () {
                const result = await this.knex.raw('SELECT 123 AS foo');
                return { foo: result.rows[0].foo };
              }`,
            }
          ]
        })
      });

    expect(res.status).toBe(200);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(`${PROJECT_DIR}/src/__generated__/dev/procedures.js`, expect.stringContaining('getTotalOrdersCount'));
    expect(writeFileSyncSpy).toHaveBeenCalledWith(`${PROJECT_DIR}/src/__generated__/dev/procedures.json`, expect.stringContaining('getTotalOrdersCount'));
  });

  it('should return error for executing RPC', async () => {
    const res = await request(server)
      .get('/execute/dev/p1/metric/m1/getTotalOrdersCount')
      .set('Authorization', `Bearer wrong-token-here`);
    expect(res.status).toBe(401);
  });
  
  it('should execute RPC', async () => {
    // Register procedure
    app.registerProcedureForComponent(Stage.development, 'p1', 'metric', 'm1', 'getTotalOrdersCount', async function() {
      const result = await this.knex?.raw('SELECT 123 AS foo');
      return { foo: result.rows[0].foo };
    });

    const res = await request(server)
      .get('/execute/dev/p1/metric/m1/getTotalOrdersCount')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ foo: 123 });
  });

  it('should return error for non-existent procedure', async () => {
    const res = await request(server)
      .get('/execute/dev/p1/metric/m1/getTotalUsersCount')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toStrictEqual({ error: 'Procedure not found' });
  });


  it('getting data for code generation', async () => {
    const res = await request(server)
      .get('/action/getDataForCodeGeneration')
      .set('Authorization', `Bearer ${jwtTokenWithBuilderRole}`)
      .query({
        actionData: JSON.stringify({
          pageId: 'p1',
          componentType: 'metric',
          componentId: 'm1',
        })
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('databaseSchema');
  });
});