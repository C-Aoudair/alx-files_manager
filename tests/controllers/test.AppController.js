import { expect } from 'chai';
import sinon from 'sinon';
import AppController from '../../controllers/AppController';
import redisClient from '../../utils/redis';
import dbClient from '../../utils/db';

describe('AppController', function() {
  let req, res;

  beforeEach(function() {
    req = {};
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe('getStatus', function() {
    it('should return status 200 with both Redis and DB alive', function() {
      sinon.stub(redisClient, 'isAlive').returns(true);
      sinon.stub(dbClient, 'isAlive').returns(true);

      AppController.getStatus(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ redis: true, db: true })).to.be.true;

      redisClient.isAlive.restore();
      dbClient.isAlive.restore();
    });

    it('should return status 200 with Redis not alive', function() {
      sinon.stub(redisClient, 'isAlive').returns(false);
      sinon.stub(dbClient, 'isAlive').returns(true);

      AppController.getStatus(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ redis: false, db: true })).to.be.true;

      redisClient.isAlive.restore();
      dbClient.isAlive.restore();
    });

    it('should return status 200 with DB not alive', function() {
      sinon.stub(redisClient, 'isAlive').returns(true);
      sinon.stub(dbClient, 'isAlive').returns(false);

      AppController.getStatus(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ redis: true, db: false })).to.be.true;

      redisClient.isAlive.restore();
      dbClient.isAlive.restore();
    });
  });

  describe('getStats', function() {
    it('should return status 200 with user and file statistics', async function() {
      sinon.stub(dbClient, 'nbUsers').resolves(10);
      sinon.stub(dbClient, 'nbFiles').resolves(5);

      await AppController.getStats(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ users: 10, files: 5 })).to.be.true;

      dbClient.nbUsers.restore();
      dbClient.nbFiles.restore();
    });

    it('should return status 500 when nbUsers throws an error', async function() {
      sinon.stub(dbClient, 'nbUsers').rejects(new Error('nbUsers Error'));
      sinon.stub(dbClient, 'nbFiles').resolves(5);

      await AppController.getStats(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Failed to fetch statistics' })).to.be.true;

      dbClient.nbUsers.restore();
      dbClient.nbFiles.restore();
    });

    it('should return status 500 when nbFiles throws an error', async function() {
      sinon.stub(dbClient, 'nbUsers').resolves(10);
      sinon.stub(dbClient, 'nbFiles').rejects(new Error('nbFiles Error'));

      await AppController.getStats(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Failed to fetch statistics' })).to.be.true;

      dbClient.nbUsers.restore();
      dbClient.nbFiles.restore();
    });
  });
});