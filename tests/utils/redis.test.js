import { expect } from 'chai';
import sinon from 'sinon';
import redis from 'redis';
import redisClient from '../../utils/redis';

describe('RedisClient Instance', function() {
  let client;
  let getStub, setexStub, delStub;

  beforeEach(() => {
    client = {
      on: sinon.spy(),
      get: sinon.stub(),
      setex: sinon.stub(),
      del: sinon.stub(),
    };

    sinon.stub(redis, 'createClient').value(client);

    getStub = sinon.stub(redisClient, 'asyncGet');
    setexStub = sinon.stub(redisClient, 'asyncSetEx');
    delStub = sinon.stub(redisClient, 'asyncDel');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get', () => {
    it('should return the value for a given key', async () => {
      const key = 'testKey';
      const value = 'testValue';
      getStub.resolves(value);

      const result = await redisClient.get(key);
      expect(result).to.equal(value);
      expect(getStub.calledWith(key)).to.be.true;
    });

    it('should throw an error if getting fails', async () => {
      const key = 'testKey';
      const error = new Error('Get error');
      getStub.rejects(error);

      try {
        await redisClient.get(key);
        expect.fail('Expected error not thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('set', () => {
    it('should set a value with a duration', async () => {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 3600;
      setexStub.resolves('OK');

      const result = await redisClient.set(key, value, duration);
      expect(result).to.equal('OK');
      expect(setexStub.calledWith(key, duration, value)).to.be.true;
    });

    it('should throw an error if setting fails', async () => {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 3600;
      const error = new Error('Set error');
      setexStub.rejects(error);

      try {
        await redisClient.set(key, value, duration);
        expect.fail('Expected error not thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'testKey';
      delStub.resolves(1);

      const result = await redisClient.del(key);
      expect(result).to.equal(1);
      expect(delStub.calledWith(key)).to.be.true;
    });

    it('should throw an error if deleting fails', async () => {
      const key = 'testKey';
      const error = new Error('Del error');
      delStub.rejects(error);

      try {
        await redisClient.del(key);
        expect.fail('Expected error not thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
