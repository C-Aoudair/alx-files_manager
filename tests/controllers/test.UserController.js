import { expect } from 'chai';
import sinon from 'sinon';
import UsersController from '../../controllers/UsersController';
import dbClient from '../../utils/db';
import Bull from 'bull';

describe('UsersController', function() {
  let req, res;

  beforeEach(function() {
    req = { body: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe('postNew', function() {
    it('should return status 400 when email is missing', async function() {
      req.body = { password: 'password123' };

      await UsersController.postNew(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Missing email' })).to.be.true;
    });

    it('should return status 400 when password is missing', async function() {
      req.body = { email: 'test@example.com' };

      await UsersController.postNew(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Missing password' })).to.be.true;
    });

    it('should return status 400 when user already exists', async function() {
      req.body = { email: 'test@example.com', password: 'password123' };
      sinon.stub(dbClient, 'isUserExist').resolves(true);

      await UsersController.postNew(req, res);

      expect(res.status.calledOnceWith(400)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'User already exists' })).to.be.true;

      dbClient.isUserExist.restore();
    });

    it('should return status 201 and create a new user', async function() {
      req.body = { email: 'test@example.com', password: 'password123' };
      sinon.stub(dbClient, 'isUserExist').resolves(false);
      sinon.stub(dbClient, 'createUser').resolves({ id: 'newUserId', email: 'test@example.com' });
      const addStub = sinon.stub(Bull.prototype, 'add').resolves();

      await UsersController.postNew(req, res);

      expect(res.status.calledOnceWith(201)).to.be.true;
      expect(res.json.calledOnceWith({ id: 'newUserId', email: 'test@example.com' })).to.be.true;
      expect(addStub.calledOnceWith({ userId: 'newUserId' })).to.be.true;

      dbClient.isUserExist.restore();
      dbClient.createUser.restore();
      addStub.restore();
    });

    it('should return status 500 when there is an error during user creation', async function() {
      req.body = { email: 'test@example.com', password: 'password123' };
      sinon.stub(dbClient, 'isUserExist').resolves(false);
      sinon.stub(dbClient, 'createUser').rejects(new Error('Create user error'));

      await UsersController.postNew(req, res);

      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.calledOnceWith({ error: 'Failed to create user' })).to.be.true;

      dbClient.isUserExist.restore();
      dbClient.createUser.restore();
    });
  });
});