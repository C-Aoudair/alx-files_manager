import { expect } from 'chai';
import sinon from 'sinon';
import AuthController from '../../controllers/AuthController';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

describe('AuthController', function() {
  let req, res;

  beforeEach(function() {
    req = { headers: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe('getConnect', function() {
    it('should return status 401 when authorization header is missing', async function() {
      await AuthController.getConnect(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should return status 401 when email or password is missing', async function() {
      req.headers.authorization = 'Basic ' + Buffer.from(':password123').toString('base64');

      await AuthController.getConnect(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should return status 401 when user does not exist', async function() {
      req.headers.authorization = 'Basic ' + Buffer.from('test@example.com:password123').toString('base64');
      sinon.stub(dbClient, 'getUser').resolves(null);

      await AuthController.getConnect(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized' })).to.be.true;

      dbClient.getUser.restore();
    });

    it('should return status 401 when password is incorrect', async function() {
      req.headers.authorization = 'Basic ' + Buffer.from('test@example.com:wrongpassword').toString('base64');
      sinon.stub(dbClient, 'getUser').resolves({ email: 'test@example.com', password: sha1('password123') });

      await AuthController.getConnect(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized' })).to.be.true;

      dbClient.getUser.restore();
    });

    it('should return status 200 and a token on successful authentication', async function() {
      req.headers.authorization = 'Basic ' + Buffer.from('test@example.com:password123').toString('base64');
      sinon.stub(dbClient, 'getUser').resolves({ email: 'test@example.com', password: sha1('password123') });
      const token = 'some-unique-token';
      sinon.stub(uuidv4, 'v4').returns(token);
      sinon.stub(redisClient, 'set').resolves();

      await AuthController.getConnect(req, res);

      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnceWith({ token })).to.be.true;

      dbClient.getUser.restore();
      uuidv4.v4.restore();
      redisClient.set.restore();
    });

    it('should return status 500 on server error', async function() {
      req.headers.authorization = 'Basic ' + Buffer.from('test@example.com:password123').toString('base64');
      sinon.stub(dbClient, 'getUser').throws(new Error('Server error'));

      await AuthController.getConnect(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Failed to authenticate' })).to.be.true;

      dbClient.getUser.restore();
    });
  });

  describe('getDisconnect', function() {
    it('should return status 401 when token header is missing', async function() {
      await AuthController.getDisconnect(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should return status 401 when token is invalid', async function() {
      req.headers['x-token'] = 'invalid-token';
      sinon.stub(redisClient, 'get').resolves(null);

      await AuthController.getDisconnect(req, res);

      expect(res.status.calledOnceWith(401)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Unauthorized' })).to.be.true;

      redisClient.get.restore();
    });

    it('should return status 204 on successful disconnection', async function() {
      req.headers['x-token'] = 'valid-token';
      sinon.stub(redisClient, 'get').resolves('user-id');
      sinon.stub(redisClient, 'del').resolves();

      await AuthController.getDisconnect(req, res);

      expect(res.status.calledOnceWith(204)).to.be.true;
      expect(res.json.notCalled).to.be.true;

      redisClient.get.restore();
      redisClient.del.restore();
    });

    it('should return status 500 on server error', async function() {
      req.headers['x-token'] = 'valid-token';
      sinon.stub(redisClient, 'get').throws(new Error('Server error'));

      await AuthController.getDisconnect(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Failed to disconnect' })).to.be.true;

      redisClient.get.restore();
    });
  });
});