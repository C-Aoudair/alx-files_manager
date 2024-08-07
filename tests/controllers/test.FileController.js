import { expect } from 'chai';
import sinon from 'sinon';
import FilesController from '../../controllers/FilesController';
import redisClient from '../../utils/redis';
import dbClient from '../../utils/db';

describe('FilesController', function() {
  let req, res, sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    req = {
      headers: {},
      body: {},
      params: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('postUpload', function() {
    it('should call validateToken and return if unauthorized', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves(null);

      await FilesController.postUpload(req, res);
      expect(FilesController.validateToken.calledOnce).to.be.true;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should proceed with upload if authorized', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves('user_id');
      req.body = {
        name: 'file.txt',
        type: 'text/plain',
        parentId: '0',
        data: 'filedata',
        isPublic: true
      };

      await FilesController.postUpload(req, res);
      expect(FilesController.validateToken.calledOnce).to.be.true;
    });
  });

  describe('getShow', function() {
    it('should return the file if it exists', async function() {
      req.params.id = 'file_id';
      sandbox.stub(dbClient, 'getFile').resolves({ id: 'file_id', name: 'file.txt' });

      await FilesController.getShow(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ id: 'file_id', name: 'file.txt' })).to.be.true;
    });

    it('should return 404 if the file does not exist', async function() {
      req.params.id = 'file_id';
      sandbox.stub(dbClient, 'getFile').resolves(null);

      await FilesController.getShow(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Not found' })).to.be.true;
    });
  });

  describe('getIndex', function() {
    it('should return a list of files for the user', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves('user_id');
      sandbox.stub(dbClient, 'getFilesForUser').resolves([{ id: 'file_id', name: 'file.txt' }]);

      await FilesController.getIndex(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith([{ id: 'file_id', name: 'file.txt' }])).to.be.true;
    });
  });

  describe('putPublish', function() {
    it('should call validateToken and return if unauthorized', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves(null);

      await FilesController.putPublish(req, res);
      expect(FilesController.validateToken.calledOnce).to.be.true;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should publish the file if authorized', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves('user_id');
      req.params.id = 'file_id';
      sandbox.stub(dbClient, 'getFileForUser').resolves({ id: 'file_id', name: 'file.txt' });
      sandbox.stub(dbClient, 'publishFile').resolves({ id: 'file_id', isPublic: true });

      await FilesController.putPublish(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ id: 'file_id', isPublic: true })).to.be.true;
    });
  });

  describe('putUnpublish', function() {
    it('should call validateToken and return if unauthorized', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves(null);

      await FilesController.putUnpublish(req, res);
      expect(FilesController.validateToken.calledOnce).to.be.true;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should unpublish the file if authorized', async function() {
      sandbox.stub(FilesController, 'validateToken').resolves('user_id');
      req.params.id = 'file_id';
      sandbox.stub(dbClient, 'getFileForUser').resolves({ id: 'file_id', name: 'file.txt' });
      sandbox.stub(dbClient, 'unPublishFile').resolves({ id: 'file_id', isPublic: false });

      await FilesController.putUnpublish(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ id: 'file_id', isPublic: false })).to.be.true;
    });
  });

  describe('getFile', function() {
    it('should return the file if it exists', async function() {
      req.params.id = 'file_id';
      sandbox.stub(dbClient, 'getFile').resolves({ id: 'file_id', name: 'file.txt' });

      await FilesController.getFile(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ id: 'file_id', name: 'file.txt' })).to.be.true;
    });

    it('should return 404 if the file does not exist', async function() {
      req.params.id = 'file_id';
      sandbox.stub(dbClient, 'getFile').resolves(null);

      await FilesController.getFile(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Not found' })).to.be.true;
    });
  });
});